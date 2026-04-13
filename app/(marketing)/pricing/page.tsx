import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Solo",
    price: "$49",
    period: "/month",
    description: "For founders running their own outbound.",
    features: [
      "200 leads researched per month",
      "Unlimited campaigns",
      "Unlimited drafts",
      "Gmail send integration",
      "LinkedIn manual-send queue",
      "Email reply tracking",
      "14-day free trial",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$129",
    period: "/month",
    description: "For agencies and growth teams.",
    features: [
      "1,000 leads researched per month",
      "Unlimited campaigns",
      "Unlimited drafts",
      "Gmail send integration",
      "LinkedIn manual-send queue",
      "Email reply tracking",
      "Priority support",
      "14-day free trial",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, honest pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          14-day free trial. No card required. You bring your own Anthropic key —
          we never mark up AI costs.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={tier.highlighted ? "border-primary shadow-lg" : "border-border/60"}
          >
            <CardHeader>
              {tier.highlighted && (
                <Badge className="mb-2 w-fit">Most popular</Badge>
              )}
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={tier.highlighted ? "default" : "outline"}
                render={<Link href="/signup" />}
              >
                {tier.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          Questions?{" "}
          <a href="mailto:hello@outreachforge.com" className="text-primary underline-offset-4 hover:underline">
            hello@outreachforge.com
          </a>
        </p>
      </div>
    </div>
  );
}
