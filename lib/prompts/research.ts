export const RESEARCH_SYSTEM_PROMPT = `You are a senior B2B outbound researcher. Your job is to read raw research material about a prospect and their company, and produce a tight, evidence-based dossier that another AI will use to write a personalized cold outreach message.

Your dossier must be:
- Specific. Generic statements ("they are a growing company") are forbidden. Every claim must be grounded in the source material.
- Honest about what you don't know. If the research is thin, say so. Do not invent facts.
- Useful for outbound. Focus on signals that suggest a buying need, not on company history trivia.
- Written in English, regardless of the source material's language.

You will be given:
1. A campaign brief describing the product being sold and its ICP.
2. A research bundle: scraped web pages, search results, and optionally a pasted LinkedIn profile.
3. Basic lead metadata (name, title, company).

You must respond with a single JSON object matching the schema provided. Do not include any text outside the JSON.`;

export interface DossierSchema {
  company_summary: string;
  role_summary: string;
  signals: string[];
  pain_hypothesis: string;
  hooks: Array<{ hook: string; rationale: string }>;
  fit_score: number;
  fit_reasoning: string;
  research_quality: "thin" | "adequate" | "rich";
}

export function buildResearchUserPrompt(params: {
  campaignBrief: Record<string, unknown>;
  fullName: string;
  title: string | null;
  companyName: string | null;
  linkedinUrl: string | null;
  location: string | null;
  researchBundle: string;
}): string {
  return `<campaign_brief>
${JSON.stringify(params.campaignBrief, null, 2)}
</campaign_brief>

<lead>
Name: ${params.fullName}
Title: ${params.title ?? "Unknown"}
Company: ${params.companyName ?? "Unknown"}
LinkedIn: ${params.linkedinUrl ?? "Not provided"}
Location: ${params.location ?? "Unknown"}
</lead>

<research_bundle>
${params.researchBundle}
</research_bundle>

Produce the dossier as JSON with this exact schema:

{
  "company_summary": "2-3 sentences about what the company actually does, in plain English.",
  "role_summary": "1-2 sentences about what this person likely owns and cares about in their role.",
  "signals": ["List of 1-5 specific recent signals: news, hiring, product launches, posts, funding, expansion. Each item must reference the source. If none found, return []."],
  "pain_hypothesis": "1-2 sentences naming the most likely pain that the product in the campaign brief could solve for this specific lead. Tie it to the signals and role.",
  "hooks": [
    {"hook": "First specific opener idea referencing the lead or company.", "rationale": "Why this hook is likely to resonate."},
    {"hook": "Second hook.", "rationale": "..."},
    {"hook": "Third hook.", "rationale": "..."}
  ],
  "fit_score": 4,
  "fit_reasoning": "1-2 sentences explaining the score from 1 (poor fit) to 5 (excellent fit).",
  "research_quality": "thin | adequate | rich"
}`;
}

export function validateDossier(raw: unknown): DossierSchema | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (
    typeof d.company_summary !== "string" ||
    typeof d.role_summary !== "string" ||
    typeof d.pain_hypothesis !== "string" ||
    typeof d.fit_score !== "number" ||
    typeof d.fit_reasoning !== "string" ||
    !Array.isArray(d.signals) ||
    !Array.isArray(d.hooks)
  ) {
    return null;
  }
  return d as unknown as DossierSchema;
}
