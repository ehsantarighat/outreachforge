import { redirect } from "next/navigation";
import { loadBillingData } from "@/app/actions/billing";
import { BillingClient } from "./billing-client";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const billing = await loadBillingData();
  if (!billing) redirect("/login");

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan and view usage.
        </p>
      </div>
      <BillingClient
        billing={billing}
        successParam={!!params.success}
        canceledParam={!!params.canceled}
      />
    </div>
  );
}
