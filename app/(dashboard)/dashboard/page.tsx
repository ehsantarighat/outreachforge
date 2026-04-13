import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadCampaigns } from "@/app/actions/campaigns";
import { PlusCircle, Users, Search, FileText, Send, MessageSquare } from "lucide-react";

export default async function DashboardPage() {
  const campaigns = await loadCampaigns();
  const active = campaigns.filter((c) => c.status !== "archived");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-muted-foreground">
            {active.length === 0
              ? "Create your first campaign to get started"
              : `${active.length} active campaign${active.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/campaigns/new" />}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New campaign
        </Button>
      </div>

      {active.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <PlusCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No campaigns yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a campaign, fill in your brief, and start adding leads.
              </p>
            </div>
            <Button nativeButton={false} render={<Link href="/campaigns/new" />}>
              Create your first campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-base leading-snug">
                      {campaign.name}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {campaign.language.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Stat icon={Users} label="Total" value={campaign.total} />
                    <Stat icon={Search} label="Researched" value={campaign.researched} />
                    <Stat icon={FileText} label="Drafted" value={campaign.drafted} />
                    <Stat icon={Send} label="Sent" value={campaign.sent} />
                    <Stat icon={MessageSquare} label="Replied" value={campaign.replied} className="col-span-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 ${className ?? ""}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}
