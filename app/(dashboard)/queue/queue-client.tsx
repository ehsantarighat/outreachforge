"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
  Link2,
} from "lucide-react";
import type { Lead } from "@/app/actions/leads";
import { markLinkedInSent, markLinkedInReplied } from "@/app/actions/queue";

type DraftsShape = {
  linkedin_dm?: { message?: string; approved?: boolean };
  linkedin_connect?: { note?: string; approved?: boolean };
};

function QueueCard({
  lead,
  onSent,
  onReplied,
}: {
  lead: Lead;
  onSent: (id: string) => void;
  onReplied: (id: string) => void;
}) {
  const [, setCopied] = useState(false);
  const [noteCopied, setNoteCopied] = useState(false);
  const [opened, setOpened] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [markingReplied, setMarkingReplied] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);

  const drafts = (lead.drafts as DraftsShape) ?? {};
  const dmMessage = drafts.linkedin_dm?.message ?? "";
  const connectNote = drafts.linkedin_connect?.note ?? "";

  async function handleCopyAndOpen() {
    try {
      await navigator.clipboard.writeText(dmMessage);
      setCopied(true);
    } catch {
      toast.error("Could not copy to clipboard — check browser permissions.");
      return;
    }

    if (lead.linkedin_url) {
      window.open(lead.linkedin_url, "_blank", "noopener,noreferrer");
    }

    setOpened(true);
    toast.success("Message copied! Paste it in LinkedIn.");
  }

  async function handleCopyNote() {
    if (!connectNote) return;
    try {
      await navigator.clipboard.writeText(connectNote);
      setNoteCopied(true);
      toast.success("Connection note copied!");
      setTimeout(() => setNoteCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  async function handleMarkSent() {
    setMarkingSent(true);
    const res = await markLinkedInSent(lead.id);
    if (res.error) {
      toast.error(res.error);
      setMarkingSent(false);
    } else {
      toast.success(`${lead.full_name} marked as sent`);
      onSent(lead.id);
    }
  }

  async function handleMarkReplied() {
    setMarkingReplied(true);
    const res = await markLinkedInReplied(lead.id);
    if (res.error) {
      toast.error(res.error);
      setMarkingReplied(false);
    } else {
      toast.success(`${lead.full_name} marked as replied`);
      onReplied(lead.id);
      setReplyDialogOpen(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Lead header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{lead.full_name}</p>
          {(lead.title || lead.company_name) && (
            <p className="text-sm text-muted-foreground">
              {[lead.title, lead.company_name].filter(Boolean).join(" at ")}
            </p>
          )}
        </div>
        {lead.linkedin_url && (
          <a
            href={lead.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <Link2 className="h-3.5 w-3.5" />
            LinkedIn
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <Separator />

      {/* DM message */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          LinkedIn DM
        </div>
        <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm whitespace-pre-wrap">
          {dmMessage || <span className="italic opacity-50">No message</span>}
        </div>
      </div>

      {/* Connection note (if exists) */}
      {connectNote && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />
              Connection note
              <span className={`ml-1 ${connectNote.length > 300 ? "text-red-500" : ""}`}>
                {connectNote.length}/300
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs px-2"
              onClick={handleCopyNote}
            >
              <Copy className="mr-1 h-3 w-3" />
              {noteCopied ? "Copied!" : "Copy note"}
            </Button>
          </div>
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
            {connectNote}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {!opened ? (
          <Button onClick={handleCopyAndOpen} disabled={!dmMessage}>
            <Copy className="mr-2 h-4 w-4" />
            Copy &amp; open profile
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleCopyAndOpen}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy again
            </Button>
            <Button
              onClick={handleMarkSent}
              disabled={markingSent}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark sent
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReplyDialogOpen(true)}
          className="text-muted-foreground ml-auto"
        >
          Mark replied
        </Button>
      </div>

      {/* Reply dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark {lead.full_name} as replied?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will move the lead to &ldquo;replied&rdquo; status in the pipeline.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkReplied} disabled={markingReplied}>
              {markingReplied ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function QueueClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);

  function handleSent(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  function handleReplied(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-20 text-center">
        <Link2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">Queue is empty</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Approve a LinkedIn DM draft in the lead detail panel and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <QueueCard
          key={lead.id}
          lead={lead}
          onSent={handleSent}
          onReplied={handleReplied}
        />
      ))}
    </div>
  );
}
