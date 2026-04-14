"use server";

import { createClient } from "@/lib/supabase/server";

export type Connection = {
  id: string;
  organization_id: string;
  imported_by: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  position: string | null;
  linkedin_url: string | null;
  connected_on: string | null;
  status: "pending" | "researching" | "done" | "error";
  category: "decision_maker" | "founder" | "investor" | "ic" | "partner" | "other" | null;
  fit_score: number | null;
  dossier: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Load all connections for current user's org ──────────────────────────────

export async function loadConnections(): Promise<Connection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Connection[];
}

// ─── Import connections from parsed CSV rows ──────────────────────────────────

export type CsvRow = {
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  position: string | null;
  linkedin_url: string | null;
  connected_on: string | null;
};

export async function importConnections(
  rows: CsvRow[]
): Promise<{ imported: number; skipped: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { imported: 0, skipped: 0, error: "Unauthorized" };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) {
    return { imported: 0, skipped: 0, error: "No organization found" };
  }

  const orgId = membership.organization_id as string;

  // Deduplicate against existing linkedin_url within org
  const { data: existing } = await supabase
    .from("connections")
    .select("linkedin_url")
    .eq("organization_id", orgId)
    .not("linkedin_url", "is", null);

  const existingUrls = new Set(
    (existing ?? []).map((r) => (r.linkedin_url as string).toLowerCase())
  );

  const toInsert = rows
    .filter((row) => {
      if (!row.full_name.trim()) return false;
      if (row.linkedin_url && existingUrls.has(row.linkedin_url.toLowerCase()))
        return false;
      return true;
    })
    .map((row) => ({
      organization_id: orgId,
      imported_by: user.id,
      full_name: row.full_name.trim(),
      first_name: row.first_name ?? null,
      last_name: row.last_name ?? null,
      email: row.email ?? null,
      company_name: row.company_name ?? null,
      position: row.position ?? null,
      linkedin_url: row.linkedin_url ?? null,
      connected_on: row.connected_on ?? null,
      status: "pending" as const,
    }));

  const skipped = rows.length - toInsert.length;

  if (toInsert.length === 0) {
    return { imported: 0, skipped };
  }

  // Insert in batches of 100
  const BATCH = 100;
  let imported = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from("connections").insert(batch);
    if (error) {
      return { imported, skipped, error: error.message };
    }
    imported += batch.length;
  }

  return { imported, skipped };
}

// ─── Delete a connection ──────────────────────────────────────────────────────

export async function deleteConnection(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Stats for the page header ────────────────────────────────────────────────

export async function getConnectionStats(): Promise<{
  total: number;
  pending: number;
  researching: number;
  done: number;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("status");

  if (!data) return { total: 0, pending: 0, researching: 0, done: 0 };

  const counts = { total: data.length, pending: 0, researching: 0, done: 0 };
  for (const row of data) {
    if (row.status === "pending") counts.pending++;
    else if (row.status === "researching") counts.researching++;
    else if (row.status === "done") counts.done++;
  }
  return counts;
}
