import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import { runResearchPipeline } from "@/lib/research/pipeline";

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

// ─── Draft Lead (placeholder — real impl in Step 9) ──────────────────────────

export const draftLead = inngest.createFunction(
  {
    id: "draft-lead",
    name: "Draft Lead",
    triggers: [{ event: "outreachforge/lead.draft.requested" }],
  },
  async ({ event, step }) => {
    const { leadId } = event.data as { leadId: string };

    await step.run("mark-drafted", async () => {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("leads")
        .update({
          status: "drafted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);
      if (error) throw new Error(error.message);
    });

    return { leadId, status: "drafted" };
  }
);
