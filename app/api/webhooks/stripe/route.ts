import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planFromPriceId } from "@/lib/stripe/plans";
import type Stripe from "stripe";

// Stripe webhooks require the raw body for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const orgId = session.metadata?.organization_id;
        if (!orgId) break;

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const plan = planFromPriceId(priceId) ?? "solo";
        // current_period_end is a Unix timestamp on the subscription object
        const periodEnd = (subscription as unknown as Record<string, number>).current_period_end;
        const renewsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

        await adminSupabase
          .from("organizations")
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            plan_renews_at: renewsAt,
          })
          .eq("id", orgId);

        // Reset usage counters for new billing period
        await resetUsage(adminSupabase, orgId);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organization_id;
        if (!orgId) break;

        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = planFromPriceId(priceId) ?? "solo";
        const subPeriodEnd = (sub as unknown as Record<string, number>).current_period_end;
        const renewsAt = subPeriodEnd ? new Date(subPeriodEnd * 1000).toISOString() : null;

        await adminSupabase
          .from("organizations")
          .update({ plan, plan_renews_at: renewsAt })
          .eq("id", orgId);

        // If billing period renewed (current_period_start just changed), reset usage
        const prevPeriodStart = (event.data.previous_attributes as Record<string, unknown>)
          ?.current_period_start;
        if (prevPeriodStart !== undefined) {
          await resetUsage(adminSupabase, orgId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organization_id;
        if (!orgId) break;

        await adminSupabase
          .from("organizations")
          .update({
            plan: "trial",
            stripe_subscription_id: null,
            plan_renews_at: null,
          })
          .eq("id", orgId);
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", event.type, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function resetUsage(
  adminSupabase: ReturnType<typeof createAdminClient>,
  orgId: string
) {
  const today = new Date().toISOString().slice(0, 10);
  await adminSupabase
    .from("usage_counters")
    .upsert(
      {
        organization_id: orgId,
        period_start: today,
        leads_researched: 0,
        drafts_generated: 0,
        emails_sent: 0,
      },
      { onConflict: "organization_id" }
    );
}
