import { notFound } from "next/navigation";
import { loadCampaign } from "@/app/actions/campaigns";
import { loadLeads } from "@/app/actions/leads";
import { loadCampaignMembers, getMyRole } from "@/app/actions/campaign-members";
import { getCapStatus } from "@/app/actions/billing";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [campaign, leads, members, myRole, capStatus] = await Promise.all([
    loadCampaign(id),
    loadLeads(id),
    loadCampaignMembers(id),
    getMyRole(id),
    getCapStatus(),
  ]);

  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-7xl">
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

      <CampaignTabs
        campaign={campaign}
        initialLeads={leads}
        members={members}
        myRole={myRole}
        currentUserId={user?.id ?? ""}
        capStatus={capStatus}
      />
    </div>
  );
}
