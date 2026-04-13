"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCampaign } from "@/app/actions/campaigns";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCampaignPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("language", language);
    startTransition(async () => {
      const result = await createCampaign(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New campaign</CardTitle>
          <CardDescription>
            Give your campaign a name to get started. You can fill in the full
            brief once it&apos;s created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Campaign name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. MENA SaaS founders Q2"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="language">Outreach language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v ?? "en")}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                More languages coming in Phase 2.
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create campaign
              </Button>
              <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
