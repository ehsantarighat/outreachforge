import { Suspense } from "react";
import { loadSettings } from "@/app/actions/settings";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const settings = await loadSettings();

  if (!settings) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile, API keys, and integrations
        </p>
      </div>
      <Suspense>
        <SettingsClient settings={settings} />
      </Suspense>
    </div>
  );
}
