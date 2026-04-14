"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_CAPS, PLAN_LABELS, PLAN_PRICES, capResetLabel, type Plan } from "@/lib/stripe/plans";

export interface BillingData {
  plan: Plan;
  planLabel: string;
  trialEndsAt: string | null;
  planRenewsAt: string | null;
  trialExpired: boolean;
  hasSubscription: boolean;
  stripeCustomerId: string | null;
  usage: {
    leadsResearched: number;
    draftsGenerated: number;
    emailsSent: number;
    cap: number;
    periodStart: string | null;
  };
  resetLabel: string;
  prices: { monthly: number; annual: number };
  priceIds: {
    soloMonthly: string;
    soloAnnual: string;
    proMonthly: string;
    proAnnual: string;
  };
}

export interface CapStatus {
  allowed: boolean;
  resetLabel: string;
}

export async function getCapStatus(): Promise<CapStatus> {
  // Billing not yet enforced — open access until subscription model is activated
  if (process.env.BILLING_ENFORCED !== "true") {
    return { allowed: true, resetLabel: "" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, resetLabel: "" };

  const adminSupabase = createAdminClient();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) return { allowed: false, resetLabel: "" };
  const orgId = membership.organization_id as string;

  const [{ data: org }, { data: usage }] = await Promise.all([
    adminSupabase
      .from("organizations")
      .select("plan, trial_ends_at, plan_renews_at")
      .eq("id", orgId)
      .maybeSingle(),
    adminSupabase
      .from("usage_counters")
      .select("leads_researched")
      .eq("organization_id", orgId)
      .maybeSingle(),
  ]);

  const plan = (org?.plan ?? "trial") as Plan;
  const trialEndsAt = (org?.trial_ends_at as string) ?? null;
  const planRenewsAt = (org?.plan_renews_at as string) ?? null;

  if (plan === "trial" && trialEndsAt && new Date(trialEndsAt) < new Date()) {
    return { allowed: false, resetLabel: "Upgrade to continue" };
  }

  const used = (usage?.leads_researched as number) ?? 0;
  const cap = PLAN_CAPS[plan];

  return {
    allowed: used < cap,
    resetLabel: capResetLabel({ plan, trial_ends_at: trialEndsAt, plan_renews_at: planRenewsAt }),
  };
}

export async function loadBillingData(): Promise<BillingData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createAdminClient();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) return null;
  const orgId = membership.organization_id as string;

  const [{ data: org }, { data: usage }] = await Promise.all([
    adminSupabase
      .from("organizations")
      .select("plan, trial_ends_at, plan_renews_at, stripe_customer_id, stripe_subscription_id")
      .eq("id", orgId)
      .maybeSingle(),
    adminSupabase
      .from("usage_counters")
      .select("leads_researched, drafts_generated, emails_sent, period_start")
      .eq("organization_id", orgId)
      .maybeSingle(),
  ]);

  const plan = (org?.plan ?? "trial") as Plan;
  const trialEndsAt = (org?.trial_ends_at as string) ?? null;
  const planRenewsAt = (org?.plan_renews_at as string) ?? null;
  const trialExpired = plan === "trial" && !!trialEndsAt && new Date(trialEndsAt) < new Date();

  return {
    plan,
    planLabel: PLAN_LABELS[plan],
    trialEndsAt,
    planRenewsAt,
    trialExpired,
    hasSubscription: !!(org?.stripe_subscription_id),
    stripeCustomerId: (org?.stripe_customer_id as string) ?? null,
    usage: {
      leadsResearched: (usage?.leads_researched as number) ?? 0,
      draftsGenerated: (usage?.drafts_generated as number) ?? 0,
      emailsSent: (usage?.emails_sent as number) ?? 0,
      cap: PLAN_CAPS[plan],
      periodStart: (usage?.period_start as string) ?? null,
    },
    resetLabel: capResetLabel({ plan, trial_ends_at: trialEndsAt, plan_renews_at: planRenewsAt }),
    prices: PLAN_PRICES[plan],
    priceIds: {
      soloMonthly: process.env.STRIPE_PRICE_SOLO_MONTHLY ?? "",
      soloAnnual: process.env.STRIPE_PRICE_SOLO_ANNUAL ?? "",
      proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
      proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
    },
  };
}
