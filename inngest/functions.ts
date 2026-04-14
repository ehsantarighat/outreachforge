import { inngest } from "./client";
import { runResearchPipeline } from "@/lib/research/pipeline";
import { runDraftPipeline } from "@/lib/draft/pipeline";

// ─── Research Lead ────────────────────────────────────────────────────────────

export const researchLead = inngest.createFunction(
  {
    id: "research-lead",
    name: "Research Lead",
    triggers: [{ event: "outreachforge/lead.research.requested" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { leadId } = event.data as { leadId: string };

    await step.run("run-research-pipeline", async () => {
      await runResearchPipeline(leadId);
    });

    return { leadId, status: "researched" };
  }
);

// ─── Draft Lead ───────────────────────────────────────────────────────────────

export const draftLead = inngest.createFunction(
  {
    id: "draft-lead",
    name: "Draft Lead",
    triggers: [{ event: "outreachforge/lead.draft.requested" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { leadId } = event.data as { leadId: string };

    await step.run("run-draft-pipeline", async () => {
      await runDraftPipeline(leadId);
    });

    return { leadId, status: "drafted" };
  }
);
