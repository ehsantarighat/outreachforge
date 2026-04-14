"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addOneLead } from "@/app/actions/leads";
import { Loader2, CheckCircle } from "lucide-react";

export function AddOneLeadTab({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ inserted?: number; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setResult(null);
    startTransition(async () => {
      const formData = new FormData(form);
      const res = await addOneLead(campaignId, formData);
      setResult(res);
      if (res.inserted) {
        form.reset();
        router.push(`/campaigns/${campaignId}`);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add one lead</CardTitle>
        <CardDescription>
          Manually enter a single prospect. Only full name is required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input id="full_name" name="full_name" placeholder="Alex Johnson" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Job title</Label>
              <Input id="title" name="title" placeholder="Head of Growth" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company</Label>
              <Input id="company_name" name="company_name" placeholder="Acme Corp" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="alex@acme.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                placeholder="https://linkedin.com/in/alexjohnson"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Dubai, UAE" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pasted_profile">
              Paste LinkedIn profile{" "}
              <span className="font-normal text-muted-foreground">(recommended)</span>
            </Label>
            <Textarea
              id="pasted_profile"
              name="pasted_profile"
              placeholder="Open the person's LinkedIn profile, select all text (Cmd+A), copy (Cmd+C), and paste here. The AI uses this to write a much better personalised message."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Without this, research quality depends entirely on public web results.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="custom_notes">Additional notes</Label>
            <Textarea
              id="custom_notes"
              name="custom_notes"
              placeholder="Any extra context you want the AI to consider — e.g. how you know them, a recent conversation, a specific angle to use."
              rows={2}
            />
          </div>

          {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
          {result?.inserted === 0 && !result.error && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <CheckCircle className="h-4 w-4" />
              Lead already exists in this campaign (duplicate URL skipped).
            </div>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add lead
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
