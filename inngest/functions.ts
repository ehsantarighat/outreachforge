import { inngest } from "./client";
import { runResearchPipeline } from "@/lib/research/pipeline";
import { runDraftPipeline } from "@/lib/draft/pipeline";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { hasReply } from "@/lib/gmail/poll";

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

// ─── Poll Email Replies ───────────────────────────────────────────────────────

export const pollEmailReplies = inngest.createFunction(
  {
    id: "poll-email-replies",
    name: "Poll Email Replies",
    triggers: [{ cron: "*/5 * * * *" }], // every 5 minutes
  },
  async ({ step }) => {
    const supabase = createAdminClient();

    // Load all sent leads with a thread ID
    const leads = await step.run("load-sent-leads", async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, gmail_thread_id, organization_id, campaign_id")
        .eq("status", "sent")
        .not("gmail_thread_id", "is", null);
      return (data ?? []) as Array<{ id: string; gmail_thread_id: string; organization_id: string; campaign_id: string }>;
    });

    if (!leads || leads.length === 0) return { checked: 0, replied: 0 };

    // Group by organization so we load each Gmail token once
    const orgIds = [...new Set(leads.map((l) => l.organization_id))];

    let repliedCount = 0;

    for (const orgId of orgIds) {
      await step.run(`check-org-${orgId}`, async () => {
        // Find an org member with a connected Gmail account
        const { data: settings } = await supabase
          .from("user_settings")
          .select("user_id, gmail_refresh_token, gmail_email")
          .not("gmail_refresh_token", "is", null)
          .limit(1)
          .maybeSingle();

        if (!settings?.gmail_refresh_token) return;

        let refreshToken: string;
        try {
          refreshToken = decrypt(settings.gmail_refresh_token as string);
        } catch {
          return;
        }

        const senderEmail = (settings.gmail_email as string) ?? "";
        const orgLeads = leads.filter((l: { organization_id: string }) => l.organization_id === orgId);

        for (const lead of orgLeads) {
          const replied = await hasReply({
            refreshToken,
            threadId: lead.gmail_thread_id as string,
            senderEmail,
          });

          if (replied) {
            const now = new Date().toISOString();
            await supabase
              .from("leads")
              .update({
                status: "replied",
                replied_at: now,
                updated_at: now,
              })
              .eq("id", lead.id as string);

            await supabase.from("activity_log").insert({
              lead_id: lead.id,
              organization_id: lead.organization_id,
              event_type: "replied",
              metadata: { thread_id: lead.gmail_thread_id },
            });

            repliedCount++;
          }
        }
      });
    }

    return { checked: leads.length, replied: repliedCount };
  }
);
