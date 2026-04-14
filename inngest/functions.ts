import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Research Lead (placeholder — real impl in Step 8) ────────────────────────

export const researchLead = inngest.createFunction(
  {
    id: "research-lead",
    name: "Research Lead",
    triggers: [{ event: "outreachforge/lead.research.requested" }],
  },
  async ({ event, step }) => {
    const { leadId } = event.data as { leadId: string };

    // Placeholder: simulate work with a 2-second delay
    await step.sleep("placeholder-delay", "2s");

    await step.run("mark-researched", async () => {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("leads")
        .update({
          status: "researched",
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);
      if (error) throw new Error(error.message);
    });

    await step.run("log-activity", async () => {
      const supabase = createAdminClient();
      const { data: lead } = await supabase
        .from("leads")
        .select("organization_id")
        .eq("id", leadId)
        .maybeSingle();
      if (!lead) return;

      await supabase.from("activity_log").insert({
        lead_id: leadId,
        organization_id: lead.organization_id,
        event_type: "researched",
        metadata: { note: "Research completed (placeholder)." },
      });
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
