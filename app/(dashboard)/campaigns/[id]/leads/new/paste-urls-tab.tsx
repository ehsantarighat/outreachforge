"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { importFromUrls } from "@/app/actions/leads";
import { Loader2, CheckCircle } from "lucide-react";

export function PasteUrlsTab({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    inserted?: number;
    skipped?: number;
    error?: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setResult(null);
    startTransition(async () => {
      const formData = new FormData(form);
      const res = await importFromUrls(campaignId, formData);
      setResult(res);
      if (res.inserted && res.inserted > 0) {
        router.push(`/campaigns/${campaignId}`);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Paste LinkedIn URLs</CardTitle>
        <CardDescription>
          One LinkedIn profile URL per line. Names will be inferred from the
          URL slug — you can edit them later in the pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="urls">LinkedIn URLs</Label>
            <Textarea
              id="urls"
              name="urls"
              placeholder={
                "https://linkedin.com/in/alex-johnson\nhttps://linkedin.com/in/sara-smith"
              }
              rows={10}
              required
              className="font-mono text-xs"
            />
          </div>

          {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
          {result?.inserted !== undefined && !result.error && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              {result.inserted} lead{result.inserted !== 1 ? "s" : ""} added
              {result.skipped ? `, ${result.skipped} duplicate${result.skipped !== 1 ? "s" : ""} skipped` : ""}.
            </div>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import leads
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
