"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefTab } from "./brief-tab";
import { SettingsTab } from "./settings-tab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Campaign {
  id: string;
  name: string;
  status: string;
  language: string;
  brief: Record<string, unknown>;
}

export function CampaignTabs({ campaign }: { campaign: Campaign }) {
  return (
    <Tabs defaultValue="pipeline">
      <TabsList className="mb-6">
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="brief">Brief</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="pipeline">
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>Pipeline view</CardTitle>
            <CardDescription>
              Lead table and Kanban board — coming in Step 6.
              <br />
              First, add leads to this campaign.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </TabsContent>

      <TabsContent value="brief">
        <BriefTab campaignId={campaign.id} brief={campaign.brief} />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsTab campaign={campaign} />
      </TabsContent>
    </Tabs>
  );
}
