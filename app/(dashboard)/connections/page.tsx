import { loadConnections, getConnectionStats } from "@/app/actions/connections";
import { ConnectionsClient } from "./connections-client";

export default async function ConnectionsPage() {
  const [connections, stats] = await Promise.all([
    loadConnections(),
    getConnectionStats(),
  ]);

  return <ConnectionsClient connections={connections} stats={stats} />;
}
