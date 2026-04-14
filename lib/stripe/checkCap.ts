import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_CAPS, capResetLabel, type Plan } from "./plans";

export interface CapStatus {
  allowed: boolean;
  plan: Plan;
  cap: number;
  used: number;
  resetLabel: string;
}

// Set to true to enforce subscription caps. False = open access (pre-launch mode).
const BILLING_ENFORCED = false;

/**
 * Check whether an org has remaining research capacity.
 * Uses admin client so it works inside API routes (no RLS).
 */
export async function checkResearchCap(orgId: string): Promise<CapStatus> {
  if (!BILLING_ENFORCED) {
    return { allowed: true, plan: "trial", cap: 9999, used: 0, resetLabel: "" };
  }
  const adminSupabase = createAdminClient();

  const { data: org } = await adminSupabase
    .from("organizations")
    .select("plan, trial_ends_at, plan_renews_at")
    .eq("id", orgId)
    .maybeSingle();

  const plan = (org?.plan ?? "trial") as Plan;

  // Trial expiry check
  if (plan === "trial" && org?.trial_ends_at) {
    const expired = new Date(org.trial_ends_at as string) < new Date();
    if (expired) {
      return { allowed: false, plan, cap: PLAN_CAPS.trial, used: PLAN_CAPS.trial, resetLabel: "Upgrade to continue" };
    }
  }

  const { data: usage } = await adminSupabase
    .from("usage_counters")
    .select("leads_researched")
    .eq("organization_id", orgId)
    .maybeSingle();

  const used = (usage?.leads_researched as number) ?? 0;
  const cap = PLAN_CAPS[plan];

  return {
    allowed: used < cap,
    plan,
    cap,
    used,
    resetLabel: capResetLabel({
      plan,
      trial_ends_at: (org?.trial_ends_at as string) ?? null,
      plan_renews_at: (org?.plan_renews_at as string) ?? null,
    }),
  };
}
