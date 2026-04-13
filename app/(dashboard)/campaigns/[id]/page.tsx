import { notFound } from "next/navigation";
import { loadCampaign } from "@/app/actions/campaigns";
import { CampaignTabs } from "./campaign-tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await loadCampaign(id);

  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Campaigns
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          {campaign.status === "archived" && (
            <Badge variant="secondary">Archived</Badge>
          )}
        </div>
      </div>

      <CampaignTabs campaign={campaign} />
    </div>
  );
}
