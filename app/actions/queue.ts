"use server";

import { createClient } from "@/lib/supabase/server";
import type { Lead } from "./leads";
import { trackEvent } from "@/lib/posthog/server";

// ─── Load LinkedIn queue ──────────────────────────────────────────────────────
// Leads where linkedin_dm is approved and not yet sent

export async function loadLinkedInQueue(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .is("linkedin_dm_sent_at", null)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  // Filter in JS: only leads with an approved linkedin_dm draft
  return (data as Lead[]).filter((lead) => {
    const drafts = lead.drafts as Record<string, Record<string, unknown>> | null;
    return drafts?.linkedin_dm?.approved === true;
  });
}

// ─── Queue count (for nav badge) ─────────────────────────────────────────────

export async function getQueueCount(): Promise<number> {
  const leads = await loadLinkedInQueue();
  return leads.length;
}

// ─── Mark LinkedIn DM sent ────────────────────────────────────────────────────

export async function markLinkedInSent(leadId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("leads")
    .update({
      linkedin_dm_sent_at: now,
      status: "sent",
      updated_at: now,
    })
    .eq("id", leadId);
  if (error) return { error: error.message };
  const { data: { user } } = await supabase.auth.getUser();
  if (user) trackEvent(user.id, "linkedin_marked_sent", { lead_id: leadId });
  return { success: true };
}

// ─── Mark replied (LinkedIn — manual) ────────────────────────────────────────

export async function markLinkedInReplied(leadId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("leads")
    .update({
      status: "replied",
      replied_at: now,
      updated_at: now,
    })
    .eq("id", leadId);
  if (error) return { error: error.message };
  return { success: true };
}
