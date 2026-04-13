"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefTab } from "./brief-tab";
import { SettingsTab } from "./settings-tab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

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
            <CardTitle>No leads yet</CardTitle>
            <CardDescription>
              Add leads to this campaign to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button nativeButton={false} render={<Link href={`/campaigns/${campaign.id}/leads/new`} />}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add leads
            </Button>
          </CardContent>
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
