import { notFound } from "next/navigation";
import { loadCampaign } from "@/app/actions/campaigns";
import { LeadIntakeTabs } from "./lead-intake-tabs";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await loadCampaign(id);
  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/campaigns/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {campaign.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Add leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import from a Sales Navigator CSV, paste LinkedIn URLs, or add a
          single lead manually.
        </p>
      </div>

      <LeadIntakeTabs campaignId={id} />
    </div>
  );
}
