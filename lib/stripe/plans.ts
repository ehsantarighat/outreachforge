export type Plan = "trial" | "solo" | "pro";

export const PLAN_CAPS: Record<Plan, number> = {
  trial: 25,
  solo: 200,
  pro: 1000,
};

export const PLAN_LABELS: Record<Plan, string> = {
  trial: "Free Trial",
  solo: "Solo",
  pro: "Pro",
};

export const PLAN_PRICES: Record<Plan, { monthly: number; annual: number }> = {
  trial: { monthly: 0, annual: 0 },
  solo: { monthly: 29, annual: 290 },
  pro: { monthly: 79, annual: 790 },
};

/** Return the plan name from a Stripe price ID */
export function planFromPriceId(priceId: string): Plan | null {
  const map: Record<string, Plan> = {
    [process.env.STRIPE_PRICE_SOLO_MONTHLY ?? ""]: "solo",
    [process.env.STRIPE_PRICE_SOLO_ANNUAL ?? ""]: "solo",
    [process.env.STRIPE_PRICE_PRO_MONTHLY ?? ""]: "pro",
    [process.env.STRIPE_PRICE_PRO_ANNUAL ?? ""]: "pro",
  };
  return map[priceId] ?? null;
}

/** Compute reset date text: trial expiry or next billing cycle */
export function capResetLabel(org: {
  plan: string;
  trial_ends_at: string | null;
  plan_renews_at: string | null;
}): string {
  if (org.plan === "trial" && org.trial_ends_at) {
    return new Date(org.trial_ends_at).toLocaleDateString();
  }
  if (org.plan_renews_at) {
    return new Date(org.plan_renews_at).toLocaleDateString();
  }
  return "next period";
}
