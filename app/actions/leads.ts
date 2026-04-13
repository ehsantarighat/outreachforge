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
    .single();
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

export async function importFromCsv(
  campaignId: string,
  leads: CsvLead[]
) {
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated", inserted: 0, skipped: 0 };
  if (leads.length === 0) return { error: "No leads to import", inserted: 0, skipped: 0 };

  return insertLeads(campaignId, orgId, leads);
}
