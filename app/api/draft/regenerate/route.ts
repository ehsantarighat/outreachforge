import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient } from "@/lib/anthropic/client";
import { DRAFT_SYSTEM_PROMPT, buildDraftUserPrompt } from "@/lib/prompts/draft";

type Artifact = "email" | "linkedin_connect" | "linkedin_dm";

const ARTIFACT_NAMES: Record<Artifact, string> = {
  email: "cold email (subject + body)",
  linkedin_connect: "LinkedIn connection note (under 300 chars)",
  linkedin_dm: "LinkedIn DM message",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    leadId?: string;
    artifact?: Artifact;
    instruction?: string;
  };

  const { leadId, artifact, instruction = "" } = body;

  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
  if (!artifact || !["email", "linkedin_connect", "linkedin_dm"].includes(artifact)) {
    return NextResponse.json({ error: "artifact must be email | linkedin_connect | linkedin_dm" }, { status: 400 });
  }

  // Verify access (RLS)
  const { data: lead } = await supabase
    .from("leads")
    .select("id, dossier, drafts, full_name, title, company_name, campaigns(*)")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.dossier) return NextResponse.json({ error: "no_dossier" }, { status: 422 });

  const campaign = (lead.campaigns as unknown as Record<string, unknown>) ?? {};
  const brief = (campaign.brief as Record<string, unknown>) ?? {};
  const orgId = (lead as Record<string, unknown>).organization_id as string;

  // Load sender info
  const adminSupabase = createAdminClient();
  const { data: org } = await adminSupabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();

  const senderName = (org?.name as string) ?? "The team";

  // Build prompt with regeneration instruction appended
  const baseUserPrompt = buildDraftUserPrompt({
    campaignBrief: brief,
    dossier: lead.dossier as Record<string, unknown>,
    fullName: lead.full_name as string,
    title: (lead.title as string) ?? null,
    companyName: (lead.company_name as string) ?? null,
    senderName,
    senderSignature: senderName,
  });

  const regenerateInstruction = `

The user is regenerating only the ${ARTIFACT_NAMES[artifact]}. Their instruction:
"${instruction || "improve it"}"

Return only that artifact in JSON, e.g.:
${artifact === "email"
  ? '{"email": {"subject": "...", "body": "..."}}'
  : artifact === "linkedin_connect"
  ? '{"linkedin_connect": {"note": "..."}}'
  : '{"linkedin_dm": {"message": "..."}}'
}`;

  const client = getAnthropicClient();

  let resultRaw: unknown;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: DRAFT_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: baseUserPrompt + regenerateInstruction },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const match =
      text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    if (!match) throw new Error("Claude returned no JSON");
    resultRaw = JSON.parse(match[1]);
  } catch (err) {
    console.error("[regenerate] Claude error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const result = resultRaw as Record<string, unknown>;

  // Merge with existing drafts
  const existingDrafts =
    (lead.drafts as Record<string, unknown>) ?? {};

  let updatedDrafts: Record<string, unknown>;

  if (artifact === "email") {
    const e = result.email as Record<string, string> | undefined;
    if (!e?.subject || !e?.body) {
      return NextResponse.json({ error: "Invalid email response" }, { status: 422 });
    }
    updatedDrafts = {
      ...existingDrafts,
      email: {
        ...(existingDrafts.email as Record<string, unknown> ?? {}),
        subject: e.subject,
        body: e.body,
        approved: false,
      },
    };
  } else if (artifact === "linkedin_connect") {
    const lc = result.linkedin_connect as Record<string, string> | undefined;
    if (!lc?.note) {
      return NextResponse.json({ error: "Invalid linkedin_connect response" }, { status: 422 });
    }
    updatedDrafts = {
      ...existingDrafts,
      linkedin_connect: {
        ...(existingDrafts.linkedin_connect as Record<string, unknown> ?? {}),
        note: lc.note.slice(0, 300),
        approved: false,
      },
    };
  } else {
    const dm = result.linkedin_dm as Record<string, string> | undefined;
    if (!dm?.message) {
      return NextResponse.json({ error: "Invalid linkedin_dm response" }, { status: 422 });
    }
    updatedDrafts = {
      ...existingDrafts,
      linkedin_dm: {
        ...(existingDrafts.linkedin_dm as Record<string, unknown> ?? {}),
        message: dm.message,
        approved: false,
      },
    };
  }

  // Save to DB
  const { error: saveErr } = await supabase
    .from("leads")
    .update({ drafts: updatedDrafts, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, drafts: updatedDrafts });
}
