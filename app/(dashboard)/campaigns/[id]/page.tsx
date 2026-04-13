import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Campaign</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{id}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Campaign view</CardTitle>
          <CardDescription>
            Pipeline, Brief, and Settings tabs — coming in Step 4.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
