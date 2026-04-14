import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { priceId?: string };
  const { priceId } = body;
  if (!priceId) return NextResponse.json({ error: "priceId required" }, { status: 400 });

  const adminSupabase = createAdminClient();

  // Load org
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) {
    return NextResponse.json({ error: "No organization found" }, { status: 422 });
  }

  const { data: org } = await adminSupabase
    .from("organizations")
    .select("id, stripe_customer_id, stripe_subscription_id")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  // If already subscribed, redirect to portal instead
  if (org.stripe_subscription_id) {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: org.stripe_customer_id as string,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });
    return NextResponse.json({ url: portalSession.url });
  }

  // Create or reuse Stripe customer
  let customerId = org.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { organization_id: org.id as string },
    });
    customerId = customer.id;
    await adminSupabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { organization_id: org.id as string },
    subscription_data: {
      metadata: { organization_id: org.id as string },
    },
  });

  return NextResponse.json({ url: session.url });
}
