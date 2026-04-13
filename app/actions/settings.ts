"use server";

import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/crypto";
import Anthropic from "@anthropic-ai/sdk";
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

// ─── Anthropic API key ────────────────────────────────────────────────────────

export async function saveAnthropicKey(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const key = (formData.get("anthropic_api_key") as string).trim();
  if (!key) return { error: "API key is required" };

  const encrypted = encrypt(key);
  const { error } = await supabase
    .from("user_settings")
    .update({ anthropic_api_key: encrypted, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function testAnthropicKey() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: settings } = await supabase
    .from("user_settings")
    .select("anthropic_api_key")
    .eq("user_id", user.id)
    .single();

  if (!settings?.anthropic_api_key) return { error: "No API key saved" };

  let apiKey: string;
  try {
    apiKey = decrypt(settings.anthropic_api_key);
  } catch {
    return { error: "Failed to decrypt stored key" };
  }

  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5,
      messages: [{ role: "user", content: "Hi" }],
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
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
    .select("default_sender_name, default_signature, anthropic_api_key, gmail_email")
    .eq("user_id", user.id)
    .single();

  return {
    email: user.email ?? "",
    default_sender_name: data?.default_sender_name ?? "",
    default_signature: data?.default_signature ?? "",
    has_anthropic_key: !!data?.anthropic_api_key,
    gmail_email: data?.gmail_email ?? null,
  };
}
