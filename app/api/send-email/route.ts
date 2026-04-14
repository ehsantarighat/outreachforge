import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { sendGmailMessage } from "@/lib/gmail/send";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { leadId?: string };
  const { leadId } = body;
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  // 1. Load lead (RLS enforced)
  const { data: lead } = await supabase
    .from("leads")
    .select("id, email, full_name, drafts, organization_id, campaign_id")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (!lead.email) {
    return NextResponse.json({ error: "no_email", message: "This lead has no email address." }, { status: 422 });
  }

  const drafts = lead.drafts as Record<string, Record<string, unknown>> | null;
  if (!drafts?.email?.subject || !drafts?.email?.body) {
    return NextResponse.json({ error: "no_draft", message: "Email draft is missing." }, { status: 422 });
  }
  if (!drafts.email.approved) {
    return NextResponse.json({ error: "not_approved", message: "Approve the email draft before sending." }, { status: 422 });
  }

  // 2. Load user settings (admin client to read encrypted token)
  const adminSupabase = createAdminClient();
  const { data: settings } = await adminSupabase
    .from("user_settings")
    .select("gmail_refresh_token, gmail_email, default_sender_name, default_signature")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.gmail_refresh_token) {
    return NextResponse.json({ error: "no_gmail", message: "Connect your Gmail account in Settings first." }, { status: 422 });
  }

  // 3. Decrypt refresh token
  let refreshToken: string;
  try {
    refreshToken = decrypt(settings.gmail_refresh_token as string);
  } catch {
    return NextResponse.json({ error: "token_decrypt_failed", message: "Could not decrypt Gmail token. Reconnect Gmail in Settings." }, { status: 500 });
  }

  const senderName = (settings.default_sender_name as string) || "";
  const senderEmail = (settings.gmail_email as string) || user.email || "";
  const signature = (settings.default_signature as string) || "";

  // Build body with signature
  const fullBody = signature
    ? `${drafts.email.body as string}\n\n${signature}`
    : (drafts.email.body as string);

  // 4. Send email
  let threadId: string;
  try {
    const result = await sendGmailMessage({
      refreshToken,
      to: lead.email as string,
      subject: drafts.email.subject as string,
      body: fullBody,
      senderName,
      senderEmail,
    });
    threadId = result.threadId;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-email] Gmail API error", message);

    // Check for auth errors
    if (message.includes("invalid_grant") || message.includes("Token has been expired")) {
      return NextResponse.json({
        error: "token_expired",
        message: "Gmail token expired. Please reconnect Gmail in Settings.",
      }, { status: 401 });
    }

    return NextResponse.json({ error: "gmail_error", message }, { status: 500 });
  }

  // 5. Update lead
  const now = new Date().toISOString();
  await supabase
    .from("leads")
    .update({
      gmail_thread_id: threadId,
      sent_at: now,
      status: "sent",
      updated_at: now,
    })
    .eq("id", leadId);

  // 6. Activity log + usage counter (admin client for activity log)
  const orgId = lead.organization_id as string;

  await adminSupabase.from("activity_log").insert({
    lead_id: leadId,
    organization_id: orgId,
    event_type: "email_sent",
    metadata: { thread_id: threadId, to: lead.email },
  });

  await incrementEmailsUsage(adminSupabase, orgId);

  return NextResponse.json({ success: true, threadId });
}

async function incrementEmailsUsage(
  supabase: ReturnType<typeof createAdminClient>,
  orgId: string
) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: usage } = await supabase
    .from("usage_counters")
    .select("emails_sent, period_start")
    .eq("organization_id", orgId)
    .maybeSingle();

  const sameMonth =
    usage?.period_start &&
    (usage.period_start as string).slice(0, 7) === today.slice(0, 7);

  if (!sameMonth) {
    await supabase.from("usage_counters").upsert(
      {
        organization_id: orgId,
        leads_researched: 0,
        drafts_generated: 0,
        emails_sent: 1,
        period_start: today,
      },
      { onConflict: "organization_id" }
    );
  } else {
    await supabase
      .from("usage_counters")
      .update({ emails_sent: ((usage?.emails_sent as number) ?? 0) + 1 })
      .eq("organization_id", orgId);
  }
}
