import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your outbound campaigns
          </p>
        </div>
        <Button render={<Link href="/campaigns/new" />}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New campaign
        </Button>
      </div>

      {/* Empty state */}
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No campaigns yet</CardTitle>
          <CardDescription>
            Create your first campaign to start researching and drafting
            personalized outreach.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button render={<Link href="/campaigns/new" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create your first campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
