import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient } from "@/lib/anthropic/client";
import {
  DRAFT_SYSTEM_PROMPT,
  buildDraftUserPrompt,
  validateDrafts,
} from "@/lib/prompts/draft";
import { trackEvent } from "@/lib/posthog/server";

export async function runDraftPipeline(leadId: string): Promise<void> {
  const supabase = createAdminClient();

  // 1. Load lead + campaign
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*, campaigns(*)")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) throw new Error(`Lead not found: ${leadId}`);

  // 2. Confirm dossier exists
  if (!lead.dossier) {
    throw new Error("no_dossier");
  }

  const campaign = (lead.campaigns as Record<string, unknown>) ?? {};
  const brief = (campaign.brief as Record<string, unknown>) ?? {};
  const orgId = lead.organization_id as string;

  // 3. Load sender info from org settings (fallback to generic values for now)
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();

  const senderName = (org?.name as string) ?? "The team";
  const senderSignature = senderName;

  // 4. Call Claude
  const client = getAnthropicClient();

  let draftsRaw: unknown;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: DRAFT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildDraftUserPrompt({
            campaignBrief: brief,
            dossier: lead.dossier as Record<string, unknown>,
            fullName: lead.full_name as string,
            title: (lead.title as string) ?? null,
            companyName: (lead.company_name as string) ?? null,
            senderName,
            senderSignature,
          }),
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const match =
      text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    if (!match) throw new Error("Claude returned no JSON");
    draftsRaw = JSON.parse(match[1]);
  } catch (err) {
    await logActivity(supabase, leadId, orgId, "draft_error", {
      error: String(err),
    });
    throw err;
  }

  // 5. Validate
  const drafts = validateDrafts(draftsRaw);
  if (!drafts) {
    await logActivity(supabase, leadId, orgId, "draft_error", {
      error: "invalid_drafts_schema",
      raw: JSON.stringify(draftsRaw).slice(0, 500),
    });
    throw new Error("Invalid drafts schema from Claude");
  }

  // 6. Store results
  await supabase
    .from("leads")
    .update({
      drafts,
      status: "drafted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  // 7. Activity log
  await logActivity(supabase, leadId, orgId, "drafted", {
    hook_used: drafts.hook_used,
  });

  // 8. Increment usage counter + track event
  await incrementDraftsUsage(supabase, orgId);
  trackEvent(orgId, "draft_generated", { lead_id: leadId });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logActivity(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string,
  orgId: string,
  eventType: string,
  metadata: Record<string, unknown>
) {
  await supabase.from("activity_log").insert({
    lead_id: leadId,
    organization_id: orgId,
    event_type: eventType,
    metadata,
  });
}

async function incrementDraftsUsage(
  supabase: ReturnType<typeof createAdminClient>,
  orgId: string
) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: usage } = await supabase
    .from("usage_counters")
    .select("drafts_generated, period_start")
    .eq("organization_id", orgId)
    .maybeSingle();

  const sameMonth =
    usage?.period_start &&
    usage.period_start.slice(0, 7) === today.slice(0, 7);

  if (!sameMonth) {
    await supabase.from("usage_counters").upsert(
      {
        organization_id: orgId,
        leads_researched: 0,
        drafts_generated: 1,
        period_start: today,
      },
      { onConflict: "organization_id" }
    );
  } else {
    await supabase
      .from("usage_counters")
      .update({
        drafts_generated: ((usage?.drafts_generated as number) ?? 0) + 1,
      })
      .eq("organization_id", orgId);
  }
}
