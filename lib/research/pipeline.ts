import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient } from "@/lib/anthropic/client";
import { tavilySearch } from "./tavily";
import { fetchWithJina } from "./jina";
import {
  RESEARCH_SYSTEM_PROMPT,
  buildResearchUserPrompt,
  validateDossier,
} from "@/lib/prompts/research";
import { trackEvent } from "@/lib/posthog/server";

// ─── Usage caps per plan (enforced properly in Step 14) ───────────────────────
const PLAN_CAP = 1000; // generous default until billing is wired

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runResearchPipeline(leadId: string): Promise<void> {
  const supabase = createAdminClient();

  // 1. Load lead + campaign
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*, campaigns(*)")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) throw new Error(`Lead not found: ${leadId}`);

  const campaign = (lead.campaigns as Record<string, unknown>) ?? {};
  const brief = (campaign.brief as Record<string, unknown>) ?? {};
  const orgId = lead.organization_id as string;

  // 2. Check usage cap
  const { data: usage } = await supabase
    .from("usage_counters")
    .select("leads_researched, period_start")
    .eq("organization_id", orgId)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);
  const sameMonth =
    usage?.period_start &&
    usage.period_start.slice(0, 7) === today.slice(0, 7);
  const monthlyCount = sameMonth ? (usage?.leads_researched ?? 0) : 0;

  if (monthlyCount >= PLAN_CAP) {
    await logActivity(supabase, leadId, orgId, "research_error", {
      error: "usage_limit_exceeded",
    });
    throw new Error("usage_limit_exceeded");
  }

  // 3. Determine company domain
  let domain: string | null = (lead.company_domain as string) ?? null;
  if (!domain && lead.company_name) {
    const results = await tavilySearch(
      `${lead.company_name as string} official site`,
      1
    );
    if (results[0]?.url) {
      try {
        domain = new URL(results[0].url).hostname.replace(/^www\./, "");
      } catch {
        domain = null;
      }
    }
  }

  // 4. Fetch web content
  const sections: string[] = [];

  if (domain) {
    const [home, about] = await Promise.all([
      fetchWithJina(`https://${domain}`),
      fetchWithJina(`https://${domain}/about`),
    ]);
    if (home) sections.push(`## Company Homepage (${domain})\n\n${home}`);
    if (about) sections.push(`## About Page\n\n${about}`);
  }

  // 5. Tavily searches
  const companyName = (lead.company_name as string) ?? "";
  const fullName = lead.full_name as string;

  const [news, person] = await Promise.all([
    companyName ? tavilySearch(`${companyName} news`) : Promise.resolve([]),
    tavilySearch(`${fullName} ${companyName}`.trim()),
  ]);

  if (news.length > 0) {
    sections.push(
      `## Recent News about ${companyName}\n\n` +
        news.map((r) => `- **${r.title}**: ${r.content}`).join("\n")
    );
  }
  if (person.length > 0) {
    sections.push(
      `## Person Research: ${fullName}\n\n` +
        person.map((r) => `- **${r.title}**: ${r.content}`).join("\n")
    );
  }

  if (lead.pasted_profile) {
    sections.push(`## Pasted Profile\n\n${lead.pasted_profile as string}`);
  }

  const researchBundle =
    sections.length > 0
      ? sections.join("\n\n---\n\n")
      : "No research data available for this lead.";

  // 6. Call Claude (platform key)
  const client = getAnthropicClient();

  let dossierRaw: unknown;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: RESEARCH_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildResearchUserPrompt({
            campaignBrief: brief,
            fullName,
            title: (lead.title as string) ?? null,
            companyName: companyName || null,
            linkedinUrl: (lead.linkedin_url as string) ?? null,
            location: (lead.location as string) ?? null,
            researchBundle,
          }),
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON — Claude sometimes wraps in ```json ... ```
    const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    if (!match) throw new Error("Claude returned no JSON");
    dossierRaw = JSON.parse(match[1]);
  } catch (err) {
    await logActivity(supabase, leadId, orgId, "research_error", {
      error: String(err),
    });
    throw err;
  }

  // 7. Validate dossier
  const dossier = validateDossier(dossierRaw);
  if (!dossier) {
    await logActivity(supabase, leadId, orgId, "research_error", {
      error: "invalid_dossier_schema",
      raw: JSON.stringify(dossierRaw).slice(0, 500),
    });
    throw new Error("Invalid dossier schema from Claude");
  }

  // 8. Store results
  await supabase
    .from("leads")
    .update({
      dossier,
      status: "researched",
      ...(domain ? { company_domain: domain } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  // 9. Activity log
  await logActivity(supabase, leadId, orgId, "researched", {
    fit_score: dossier.fit_score,
    research_quality: dossier.research_quality,
  });

  // 10. Increment usage counter + track event
  await incrementUsage(supabase, orgId, today, monthlyCount, sameMonth);
  trackEvent(orgId, "research_completed", {
    lead_id: leadId,
    fit_score: dossier.fit_score,
    research_quality: dossier.research_quality,
  });
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

async function incrementUsage(
  supabase: ReturnType<typeof createAdminClient>,
  orgId: string,
  today: string,
  currentCount: number,
  sameMonth: boolean | null | undefined
) {
  if (!sameMonth) {
    await supabase.from("usage_counters").upsert(
      {
        organization_id: orgId,
        leads_researched: 1,
        drafts_generated: 0,
        period_start: today,
      },
      { onConflict: "organization_id" }
    );
  } else {
    await supabase
      .from("usage_counters")
      .update({ leads_researched: currentCount + 1 })
      .eq("organization_id", orgId);
  }
}
