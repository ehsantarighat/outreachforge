"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvUploadTab } from "./csv-upload-tab";
import { PasteUrlsTab } from "./paste-urls-tab";
import { AddOneLeadTab } from "./add-one-lead-tab";

export function LeadIntakeTabs({ campaignId }: { campaignId: string }) {
  return (
    <Tabs defaultValue="csv">
      <TabsList className="mb-6">
        <TabsTrigger value="csv">Upload CSV</TabsTrigger>
        <TabsTrigger value="urls">Paste URLs</TabsTrigger>
        <TabsTrigger value="one">Add one lead</TabsTrigger>
      </TabsList>
      <TabsContent value="csv">
        <CsvUploadTab campaignId={campaignId} />
      </TabsContent>
      <TabsContent value="urls">
        <PasteUrlsTab campaignId={campaignId} />
      </TabsContent>
      <TabsContent value="one">
        <AddOneLeadTab campaignId={campaignId} />
      </TabsContent>
    </Tabs>
  );
}
