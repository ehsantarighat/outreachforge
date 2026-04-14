"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getOrgId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return (data?.organization_id as string) ?? null;
}

interface LeadRow {
  full_name: string;
  title?: string;
  company_name?: string;
  linkedin_url?: string;
  email?: string;
  location?: string;
  custom_notes?: string;
}

async function insertLeads(
  campaignId: string,
  orgId: string,
  leads: LeadRow[]
) {
  const supabase = await createClient();

  // Fetch existing linkedin_urls for duplicate detection
  const { data: existing } = await supabase
    .from("leads")
    .select("linkedin_url")
    .eq("campaign_id", campaignId)
    .not("linkedin_url", "is", null);

  const existingUrls = new Set(
    (existing ?? []).map((r) => r.linkedin_url as string)
  );

  const toInsert = leads
    .filter((l) => l.full_name.trim())
    .filter(
      (l) => !l.linkedin_url || !existingUrls.has(l.linkedin_url.trim())
    )
    .map((l) => ({
      campaign_id: campaignId,
      organization_id: orgId,
      status: "new" as const,
      full_name: l.full_name.trim(),
      title: l.title?.trim() || null,
      company_name: l.company_name?.trim() || null,
      linkedin_url: l.linkedin_url?.trim() || null,
      email: l.email?.trim() || null,
      location: l.location?.trim() || null,
      custom_notes: l.custom_notes?.trim() || null,
    }));

  const skipped = leads.length - toInsert.length;

  if (toInsert.length === 0) {
    return { inserted: 0, skipped };
  }

  const { error } = await supabase.from("leads").insert(toInsert);
  if (error) return { error: error.message, inserted: 0, skipped: skipped };

  revalidatePath(`/campaigns/${campaignId}`);
  return { inserted: toInsert.length, skipped };
}

// ─── Add one lead ─────────────────────────────────────────────────────────────

export async function addOneLead(campaignId: string, formData: FormData) {
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated", inserted: 0, skipped: 0 };

  const full_name = (formData.get("full_name") as string).trim();
  if (!full_name) return { error: "Full name is required", inserted: 0, skipped: 0 };

  return insertLeads(campaignId, orgId, [
    {
      full_name,
      title: formData.get("title") as string,
      company_name: formData.get("company_name") as string,
      linkedin_url: formData.get("linkedin_url") as string,
      email: formData.get("email") as string,
      location: formData.get("location") as string,
      custom_notes: formData.get("custom_notes") as string,
    },
  ]);
}

// ─── Paste URLs ───────────────────────────────────────────────────────────────

export async function importFromUrls(campaignId: string, formData: FormData) {
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated", inserted: 0, skipped: 0 };

  const raw = (formData.get("urls") as string) ?? "";
  const urls = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("http"));

  if (urls.length === 0) return { error: "No valid URLs found", inserted: 0, skipped: 0 };

  const leads: LeadRow[] = urls.map((url) => ({
    full_name: url
      .replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, "")
      .replace(/\/$/, "")
      .replace(/-/g, " ")
      .trim() || "Unknown",
    linkedin_url: url,
  }));

  return insertLeads(campaignId, orgId, leads);
}

// ─── CSV import ───────────────────────────────────────────────────────────────

export interface CsvLead {
  full_name: string;
  title: string;
  company_name: string;
  linkedin_url: string;
  email: string;
  location: string;
}

// ─── Load leads ───────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  campaign_id: string;
  organization_id: string;
  status: string;
  full_name: string;
  title: string | null;
  company_name: string | null;
  company_domain: string | null;
  linkedin_url: string | null;
  email: string | null;
  location: string | null;
  pasted_profile: string | null;
  custom_notes: string | null;
  dossier: Record<string, unknown> | null;
  drafts: Record<string, unknown> | null;
  sent_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function loadLeads(campaignId: string): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Lead[];
}

// ─── Update dossier ───────────────────────────────────────────────────────────

export async function updateDossier(
  leadId: string,
  dossier: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ dossier, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Update drafts ────────────────────────────────────────────────────────────

export async function updateDrafts(
  leadId: string,
  drafts: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ drafts, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Refresh single lead ──────────────────────────────────────────────────────

export async function refreshLead(leadId: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  return (data ?? null) as Lead | null;
}

// ─── Delete lead ──────────────────────────────────────────────────────────────

export async function deleteLead(leadId: string, campaignId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

export async function importFromCsv(
  campaignId: string,
  leads: CsvLead[]
) {
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated", inserted: 0, skipped: 0 };
  if (leads.length === 0) return { error: "No leads to import", inserted: 0, skipped: 0 };

  return insertLeads(campaignId, orgId, leads);
}
