"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefTab } from "./brief-tab";
import { SettingsTab } from "./settings-tab";
import { PipelineTab } from "./pipeline-tab";
import type { Lead } from "@/app/actions/leads";
import type { CampaignMember, MemberRole } from "@/app/actions/campaign-members";
import type { CapStatus } from "@/app/actions/billing";

interface Campaign {
  id: string;
  name: string;
  status: string;
  language: string;
  brief: Record<string, unknown>;
}

export function CampaignTabs({
  campaign,
  initialLeads,
  members,
  myRole,
  currentUserId,
  capStatus,
}: {
  campaign: Campaign;
  initialLeads: Lead[];
  members: CampaignMember[];
  myRole: MemberRole | null;
  currentUserId: string;
  capStatus: CapStatus;
}) {
  return (
    <Tabs defaultValue="pipeline">
      <TabsList className="mb-6">
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="brief">Brief</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="pipeline">
        <PipelineTab campaignId={campaign.id} initialLeads={initialLeads} capStatus={capStatus} />
      </TabsContent>

      <TabsContent value="brief">
        <BriefTab campaignId={campaign.id} brief={campaign.brief} />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsTab
          campaign={campaign}
          members={members}
          myRole={myRole}
          currentUserId={currentUserId}
        />
      </TabsContent>
    </Tabs>
  );
}
