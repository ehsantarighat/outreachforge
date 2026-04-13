"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { renameCampaign, archiveCampaign, deleteCampaign } from "@/app/actions/campaigns";
import { Loader2 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: string;
}

export function SettingsTab({ campaign }: { campaign: Campaign }) {
  const [isRenaming, startRename] = useTransition();
  const [isArchiving, startArchive] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [renameResult, setRenameResult] = useState<{ success?: boolean; error?: string } | null>(null);

  function handleRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRenameResult(null);
    const formData = new FormData(e.currentTarget);
    startRename(async () => {
      const res = await renameCampaign(campaign.id, formData);
      setRenameResult(res);
    });
  }

  return (
    <div className="space-y-6">
      {/* Rename */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign name</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRename} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="name" className="sr-only">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={campaign.name}
                required
              />
            </div>
            <Button type="submit" disabled={isRenaming}>
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </form>
          {renameResult?.error && (
            <p className="mt-2 text-sm text-red-600">{renameResult.error}</p>
          )}
          {renameResult?.success && (
            <p className="mt-2 text-sm text-green-600">Renamed.</p>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            These actions are permanent or hard to reverse.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          {campaign.status !== "archived" && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" disabled={isArchiving} />}>
                {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Archive campaign
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The campaign will be hidden from the dashboard. All leads and
                    data are kept. You can restore it later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { startArchive(async () => { await archiveCampaign(campaign.id); }); }}
                  >
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" disabled={isDeleting} />}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete campaign
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{campaign.name}&rdquo; and
                  all its leads, dossiers, and drafts. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { startDelete(async () => { await deleteCampaign(campaign.id); }); }}
                >
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
