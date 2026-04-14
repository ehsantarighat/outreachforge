import { loadLinkedInQueue } from "@/app/actions/queue";
import { QueueClient } from "./queue-client";

export default async function QueuePage() {
  const leads = await loadLinkedInQueue();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">LinkedIn Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved LinkedIn messages waiting to be sent manually.
          {leads.length > 0 && (
            <span className="ml-1 font-medium text-foreground">
              {leads.length} pending
            </span>
          )}
        </p>
      </div>

      <QueueClient initialLeads={leads} />
    </div>
  );
}
