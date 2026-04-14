import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { hasReply } from "@/lib/gmail/poll";

/**
 * POST /api/poll-replies
 * Manually checks Gmail threads for replies on all "sent" leads
 * belonging to the current user's organization.
 * Called by the "Sync replies" button in the UI.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createAdminClient();

  // 1. Get user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) {
    return NextResponse.json({ error: "No organization found" }, { status: 422 });
  }
  const orgId = membership.organization_id as string;

  // 2. Get current user's Gmail token
  const { data: settings } = await adminSupabase
    .from("user_settings")
    .select("gmail_refresh_token, gmail_email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.gmail_refresh_token) {
    return NextResponse.json({ error: "no_gmail", message: "Connect Gmail in Settings first." }, { status: 422 });
  }

  let refreshToken: string;
  try {
    refreshToken = decrypt(settings.gmail_refresh_token as string);
  } catch {
    return NextResponse.json({ error: "token_decrypt_failed" }, { status: 500 });
  }

  const senderEmail = (settings.gmail_email as string) ?? "";

  // 3. Load sent leads with a thread ID in this org
  const { data: leads } = await supabase
    .from("leads")
    .select("id, gmail_thread_id, organization_id")
    .eq("status", "sent")
    .eq("organization_id", orgId)
    .not("gmail_thread_id", "is", null);

  if (!leads || leads.length === 0) {
    return NextResponse.json({ checked: 0, replied: 0 });
  }

  // 4. Check each thread
  let repliedCount = 0;
  for (const lead of leads) {
    const replied = await hasReply({
      refreshToken,
      threadId: lead.gmail_thread_id as string,
      senderEmail,
    });

    if (replied) {
      const now = new Date().toISOString();
      await adminSupabase
        .from("leads")
        .update({ status: "replied", replied_at: now, updated_at: now })
        .eq("id", lead.id as string);

      await adminSupabase.from("activity_log").insert({
        lead_id: lead.id,
        organization_id: lead.organization_id,
        event_type: "replied",
        metadata: { thread_id: lead.gmail_thread_id },
      });

      repliedCount++;
    }
  }

  return NextResponse.json({ checked: leads.length, replied: repliedCount });
}
