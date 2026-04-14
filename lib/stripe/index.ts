import Stripe from "stripe";

// Lazy singleton — only instantiated when first called, not at module load time.
// This prevents build failures when STRIPE_SECRET_KEY is not set.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

// Keep named export for backwards-compat callers
export { getStripe as stripe };
