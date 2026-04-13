"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { saveBrief } from "@/app/actions/campaigns";
import { Loader2 } from "lucide-react";

interface Brief {
  product_name?: string;
  product_oneliner?: string;
  problem_statement?: string;
  target_icp?: string;
  value_props?: string[];
  proof_points?: string[];
  tone_dos?: string[];
  tone_donts?: string[];
}

function TripleInputs({
  label,
  name,
  values,
  placeholders,
}: {
  label: string;
  name: string;
  values: string[];
  placeholders: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Input
            key={i}
            name={`${name}_${i}`}
            defaultValue={values[i] ?? ""}
            placeholder={placeholders[i]}
          />
        ))}
      </div>
    </div>
  );
}

export function BriefTab({
  campaignId,
  brief,
}: {
  campaignId: string;
  brief: Record<string, unknown>;
}) {
  const b = brief as Brief;
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveBrief(campaignId, formData);
      setResult(res);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign brief</CardTitle>
        <CardDescription>
          This brief is used as context for every research and drafting job in
          this campaign. Updating it does not regenerate existing dossiers or
          drafts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Product
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="product_name">Product name</Label>
              <Input
                id="product_name"
                name="product_name"
                defaultValue={b.product_name ?? ""}
                placeholder="e.g. OutreachForge"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product_oneliner">One-liner</Label>
              <Input
                id="product_oneliner"
                name="product_oneliner"
                defaultValue={b.product_oneliner ?? ""}
                placeholder="AI-powered outbound for emerging market founders"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="problem_statement">Problem you solve</Label>
              <Textarea
                id="problem_statement"
                name="problem_statement"
                defaultValue={b.problem_statement ?? ""}
                placeholder="Founders selling B2B in CIS/MENA can't get quality outbound because Apollo has no data and AI drafts sound like a tourist wrote them."
                rows={3}
              />
            </div>
          </div>

          {/* ICP */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Ideal Customer
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="target_icp">ICP description</Label>
              <Textarea
                id="target_icp"
                name="target_icp"
                defaultValue={b.target_icp ?? ""}
                placeholder="B2B SaaS founders and growth leads at 10-100 person companies in Central Asia and the Gulf. Selling to mid-market businesses."
                rows={3}
              />
            </div>
          </div>

          {/* Value props */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Messaging
            </h3>
            <TripleInputs
              label="Value propositions (3)"
              name="value_props"
              values={b.value_props ?? []}
              placeholders={[
                "Research that actually covers CIS/MENA companies",
                "Drafts that sound like you, not ChatGPT",
                "Send via your own Gmail — no shared infrastructure",
              ]}
            />
            <TripleInputs
              label="Proof points (3)"
              name="proof_points"
              values={b.proof_points ?? []}
              placeholders={[
                "Used by 50+ founders in Kazakhstan and UAE",
                "Average reply rate 12% vs 3% industry average",
                "Built by a founder who ran outbound in Almaty",
              ]}
            />
          </div>

          {/* Tone */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tone
            </h3>
            <TripleInputs
              label="Do's (3)"
              name="tone_dos"
              values={b.tone_dos ?? []}
              placeholders={[
                "Be direct and specific — reference something real",
                "Write like a founder, not a salesperson",
                "One clear ask per message",
              ]}
            />
            <TripleInputs
              label="Don'ts (3)"
              name="tone_donts"
              values={b.tone_donts ?? []}
              placeholders={[
                "No 'I hope this email finds you well'",
                "No generic openers about coming across their profile",
                "No more than two sentences of context before the ask",
              ]}
            />
          </div>

          {result?.error && (
            <p className="text-sm text-red-600">{result.error}</p>
          )}
          {result?.success && (
            <p className="text-sm text-green-600">Brief saved.</p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save brief
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
