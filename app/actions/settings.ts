"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("user_settings")
    .update({
      default_sender_name: formData.get("default_sender_name") as string,
      default_signature: formData.get("default_signature") as string,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

// ─── Gmail disconnect ─────────────────────────────────────────────────────────

export async function disconnectGmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("user_settings")
    .update({
      gmail_refresh_token: null,
      gmail_email: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

// ─── Load settings (for page) ─────────────────────────────────────────────────

export async function loadSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_settings")
    .select("default_sender_name, default_signature, gmail_email")
    .eq("user_id", user.id)
    .single();

  return {
    email: user.email ?? "",
    default_sender_name: data?.default_sender_name ?? "",
    default_signature: data?.default_signature ?? "",
    gmail_email: data?.gmail_email ?? null,
  };
}
