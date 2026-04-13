"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

  return data?.organization_id ?? null;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCampaign(formData: FormData) {
  const supabase = await createClient();
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated" };

  const name = (formData.get("name") as string).trim();
  const language = (formData.get("language") as string) || "en";
  if (!name) return { error: "Campaign name is required" };

  const { data, error } = await supabase
    .from("campaigns")
    .insert({ organization_id: orgId, name, language, brief: {} })
    .select("id")
    .single();

  if (error) return { error: error.message };

  redirect(`/campaigns/${data.id}`);
}

// ─── Load list ────────────────────────────────────────────────────────────────

export async function loadCampaigns() {
  const supabase = await createClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data } = await supabase
    .from("campaigns")
    .select(`
      id, name, status, language, created_at,
      leads(status)
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((c) => {
    const leads = (c.leads ?? []) as { status: string }[];
    return {
      id: c.id as string,
      name: c.name as string,
      status: c.status as string,
      language: c.language as string,
      created_at: c.created_at as string,
      total: leads.length,
      researched: leads.filter((l) => l.status === "researched").length,
      drafted: leads.filter((l) => l.status === "drafted").length,
      sent: leads.filter((l) => l.status === "sent").length,
      replied: leads.filter((l) => l.status === "replied").length,
    };
  });
}

// ─── Load single ──────────────────────────────────────────────────────────────

export async function loadCampaign(id: string) {
  const supabase = await createClient();
  const orgId = await getOrgId();
  if (!orgId) return null;

  const { data } = await supabase
    .from("campaigns")
    .select("id, name, status, language, brief, created_at")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  return data ?? null;
}

// ─── Update brief ─────────────────────────────────────────────────────────────

export async function saveBrief(campaignId: string, formData: FormData) {
  const supabase = await createClient();
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated" };

  const brief = {
    product_name: formData.get("product_name") as string,
    product_oneliner: formData.get("product_oneliner") as string,
    problem_statement: formData.get("problem_statement") as string,
    target_icp: formData.get("target_icp") as string,
    value_props: [
      formData.get("value_props_0") as string,
      formData.get("value_props_1") as string,
      formData.get("value_props_2") as string,
    ],
    proof_points: [
      formData.get("proof_points_0") as string,
      formData.get("proof_points_1") as string,
      formData.get("proof_points_2") as string,
    ],
    tone_dos: [
      formData.get("tone_dos_0") as string,
      formData.get("tone_dos_1") as string,
      formData.get("tone_dos_2") as string,
    ],
    tone_donts: [
      formData.get("tone_donts_0") as string,
      formData.get("tone_donts_1") as string,
      formData.get("tone_donts_2") as string,
    ],
  };

  const { error } = await supabase
    .from("campaigns")
    .update({ brief, updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

// ─── Rename ───────────────────────────────────────────────────────────────────

export async function renameCampaign(campaignId: string, formData: FormData) {
  const supabase = await createClient();
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated" };

  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "Name is required" };

  const { error } = await supabase
    .from("campaigns")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

// ─── Archive ──────────────────────────────────────────────────────────────────

export async function archiveCampaign(campaignId: string) {
  const supabase = await createClient();
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteCampaign(campaignId: string) {
  const supabase = await createClient();
  const orgId = await getOrgId();
  if (!orgId) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
