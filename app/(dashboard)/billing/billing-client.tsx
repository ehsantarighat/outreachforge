"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, Zap, Rocket } from "lucide-react";
import type { BillingData } from "@/app/actions/billing";

function UsageBar({ used, cap }: { used: number; cap: number }) {
  const pct = Math.min((used / cap) * 100, 100);
  const danger = pct >= 90;
  const warn = pct >= 70;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Leads researched</span>
        <span className={`font-medium tabular-nums ${danger ? "text-red-500" : warn ? "text-amber-500" : ""}`}>
          {used} / {cap}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${danger ? "bg-red-500" : warn ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface PriceCardProps {
  name: string;
  monthlyUsd: number;
  annualUsd: number;
  cap: number;
  features: string[];
  priceIdMonthly: string;
  priceIdAnnual: string;
  current: boolean;
  onSelect: (priceId: string) => void;
  loading: boolean;
}

function PriceCard({
  name,
  monthlyUsd,
  annualUsd,
  cap,
  features,
  priceIdMonthly,
  priceIdAnnual,
  current,
  onSelect,
  loading,
}: PriceCardProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <div className={`rounded-xl border p-6 space-y-4 ${current ? "border-primary bg-primary/5" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{cap} leads / month</p>
        </div>
        {current && (
          <span className="text-xs font-medium bg-primary text-primary-foreground rounded-full px-2.5 py-1">
            Current plan
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${annual ? Math.round(annualUsd / 12) : monthlyUsd}</span>
          <span className="text-muted-foreground text-sm">/ month</span>
        </div>
        {annual && (
          <p className="text-xs text-muted-foreground">Billed ${annualUsd}/year (save ~17%)</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${!annual ? "bg-muted" : "hover:bg-muted/50"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${annual ? "bg-muted" : "hover:bg-muted/50"}`}
        >
          Annual
        </button>
      </div>

      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        className="w-full"
        variant={current ? "outline" : "default"}
        disabled={current || loading || (!priceIdMonthly && !priceIdAnnual)}
        onClick={() => onSelect(annual ? priceIdAnnual : priceIdMonthly)}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {current ? "Current plan" : "Upgrade"}
      </Button>
    </div>
  );
}

export function BillingClient({
  billing,
  successParam,
  canceledParam,
}: {
  billing: BillingData;
  successParam: boolean;
  canceledParam: boolean;
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (successParam) toast.success("Subscription activated! Welcome to OutreachForge.");
    if (canceledParam) toast.info("Checkout canceled — your plan was not changed.");
  }, [successParam, canceledParam]);

  async function handleUpgrade(priceId: string) {
    if (!priceId) {
      toast.error("Price not configured. Contact support.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Could not start checkout");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Checkout failed — try again");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Could not open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Failed to open portal");
    } finally {
      setPortalLoading(false);
    }
  }

  const { plan, planLabel, trialEndsAt, planRenewsAt, trialExpired, hasSubscription, usage, resetLabel, priceIds } = billing;

  return (
    <div className="space-y-8">
      {/* Current plan */}
      <div className="rounded-xl border p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Current plan
            </p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{planLabel}</h2>
              {plan === "trial" && !trialExpired && (
                <span className="text-xs bg-amber-500/15 text-amber-600 rounded-full px-2 py-0.5 font-medium">
                  Trial
                </span>
              )}
              {trialExpired && (
                <span className="text-xs bg-red-500/15 text-red-600 rounded-full px-2 py-0.5 font-medium">
                  Expired
                </span>
              )}
            </div>
            {plan === "trial" && trialEndsAt && !trialExpired && (
              <p className="text-sm text-muted-foreground mt-1">
                Trial ends {new Date(trialEndsAt).toLocaleDateString()}
              </p>
            )}
            {planRenewsAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Renews {new Date(planRenewsAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {hasSubscription && (
            <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Manage billing
            </Button>
          )}
        </div>

        <Separator />

        {/* Usage */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Usage this period — resets {resetLabel}
          </p>
          <UsageBar used={usage.leadsResearched} cap={usage.cap} />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground text-xs mb-1">Drafts generated</p>
              <p className="font-semibold">{usage.draftsGenerated}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground text-xs mb-1">Emails sent</p>
              <p className="font-semibold">{usage.emailsSent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade options (hide if already on Pro) */}
      {plan !== "pro" && (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-1">Upgrade your plan</h2>
            <p className="text-sm text-muted-foreground">
              All plans include unlimited campaigns, Gmail integration, and LinkedIn queue.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PriceCard
              name="Solo"
              monthlyUsd={29}
              annualUsd={290}
              cap={200}
              features={[
                "200 leads researched / month",
                "Unlimited drafts",
                "Gmail send + reply tracking",
                "LinkedIn manual queue",
              ]}
              priceIdMonthly={priceIds.soloMonthly}
              priceIdAnnual={priceIds.soloAnnual}
              current={plan === "solo"}
              onSelect={handleUpgrade}
              loading={checkoutLoading}
            />
            <PriceCard
              name="Pro"
              monthlyUsd={79}
              annualUsd={790}
              cap={1000}
              features={[
                "1 000 leads researched / month",
                "Unlimited drafts",
                "Gmail send + reply tracking",
                "LinkedIn manual queue",
                "Priority support",
              ]}
              priceIdMonthly={priceIds.proMonthly}
              priceIdAnnual={priceIds.proAnnual}
              current={billing.plan === "pro"}
              onSelect={handleUpgrade}
              loading={checkoutLoading}
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            <Zap className="h-5 w-5 shrink-0 text-amber-500" />
            <span>
              Need more than 1 000 leads/month?{" "}
              <a href="mailto:hello@outreachforge.com" className="underline text-foreground">
                Talk to us
              </a>{" "}
              about a custom plan.
            </span>
          </div>
        </>
      )}

      {billing.plan === "pro" && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <Rocket className="h-5 w-5 shrink-0 text-primary" />
          <span>
            You&apos;re on the Pro plan. Need more capacity?{" "}
            <a href="mailto:hello@outreachforge.com" className="underline text-foreground">
              Contact us
            </a>{" "}
            for custom volume.
          </span>
        </div>
      )}
    </div>
  );
}
