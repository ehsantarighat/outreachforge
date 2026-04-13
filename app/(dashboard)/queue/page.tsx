import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QueuePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">LinkedIn Queue</h1>
        <p className="mt-1 text-muted-foreground">
          Approved LinkedIn messages waiting to be sent manually
        </p>
      </div>
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Queue is empty</CardTitle>
          <CardDescription>
            Approved LinkedIn drafts will appear here. Click &quot;Copy and open profile&quot; to send manually.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
