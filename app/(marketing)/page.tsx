import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Send, Check } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Deep Research",
    description:
      "For each prospect, we fetch their company site, scan for recent news, funding, hiring signals, and product launches — then Claude builds a structured dossier with specific hooks tailored to your product.",
  },
  {
    icon: FileText,
    title: "Native-Quality Drafts",
    description:
      "Three artifacts per lead: a cold email, a LinkedIn connection note, and a first-message DM — all grounded in the research, all referencing a specific hook. No generic openers. Ever.",
  },
  {
    icon: Send,
    title: "Safe Sending",
    description:
      "Email goes out through your connected Gmail account. LinkedIn sending is manual-only — we copy the message to your clipboard and open the profile. Your account stays safe.",
  },
];

const pricingTiers = [
  {
    name: "Solo",
    price: "$49",
    period: "/month",
    description: "For founders running their own outbound.",
    features: [
      "200 leads researched per month",
      "Unlimited drafts",
      "Gmail integration",
      "LinkedIn manual-send queue",
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
      "Unlimited drafts",
      "Gmail integration",
      "LinkedIn manual-send queue",
      "Priority support",
      "14-day free trial",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
];

const faqs = [
  {
    q: "Do I need to give OutreachForge access to my LinkedIn?",
    a: "No. LinkedIn sending is fully manual. We copy the message to your clipboard and open the profile in a new tab — you paste and send. Your account is never at risk.",
  },
  {
    q: "What is BYOK?",
    a: "Bring Your Own Key. You connect your own Anthropic API key, and we proxy all AI calls through it. You pay Anthropic directly — usually a few cents per lead — and we never mark it up.",
  },
  {
    q: "Will this work for prospects in Russia, Uzbekistan, or the Gulf?",
    a: "Yes. The research engine finds whatever is publicly available on the web in any language, and Claude produces English drafts grounded in that research. Phase 2 adds native-language drafting.",
  },
  {
    q: "How is this different from Apollo or Clay?",
    a: "We don't have a lead database — you bring your own list. What we provide is the research-and-drafting brain: deep dossiers and genuinely personalized messages for the leads you've already identified.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              Built for emerging markets first
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Cold outbound that sounds like{" "}
              <span className="text-primary">you wrote it yourself</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              For founders selling B2B in markets the big tools forgot. Deep
              research, native-quality drafts, safe sending — powered by Claude
              and your own Gmail.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" render={<Link href="/signup" />}>
                Start free — 14 days, no card
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/pricing" />}>
                See pricing
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Bring your own Anthropic API key. No per-lead markup.
            </p>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The missing middle layer
            </h2>
            <p className="mt-4 text-muted-foreground">
              You already have a way to find prospects and a way to send email.
              OutreachForge is the research-and-drafting brain in between.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/60">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t py-16 sm:py-24" id="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              14-day free trial. No card required. Cancel any time.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlighted
                    ? "border-primary shadow-lg"
                    : "border-border/60"
                }
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
                  <p className="text-sm text-muted-foreground">
                    {tier.description}
                  </p>
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
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">
            Frequently asked
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border p-6">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to send better outbound?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start your 14-day free trial. No card required.
          </p>
          <Button size="lg" className="mt-8" render={<Link href="/signup" />}>
            Get started for free
          </Button>
        </div>
      </section>
    </>
  );
}
