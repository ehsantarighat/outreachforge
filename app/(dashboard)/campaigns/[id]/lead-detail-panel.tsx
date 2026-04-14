"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ExternalLink,
  Loader2,
  Mail,
  FlaskConical,
  Sparkles,
  Link2,
} from "lucide-react";
import type { Lead } from "@/app/actions/leads";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  researched: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  drafted: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  approved: "bg-green-500/15 text-green-600 dark:text-green-400",
  sent: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  replied: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  meeting: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  won: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  lost: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform text-muted-foreground ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 py-3 border-t text-sm text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  title,
  charLimit,
  content,
}: {
  title: string;
  charLimit?: number;
  content?: string;
}) {
  const text = content ?? "";
  const overLimit = charLimit && text.length > charLimit;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        {text && (
          <span
            className={`text-xs ${overLimit ? "text-red-500" : "text-muted-foreground"}`}
          >
            {text.length}
            {charLimit ? `/${charLimit}` : ""} chars
          </span>
        )}
      </div>
      <div className="min-h-[80px] rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground italic">
        {text || "No draft yet — click Generate Drafts to create one."}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={!text}>
          Approve
        </Button>
        <Button size="sm" variant="ghost" disabled>
          Regenerate
        </Button>
      </div>
    </div>
  );
}

interface LeadDetailPanelProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

export function LeadDetailPanel({ lead, open, onClose }: LeadDetailPanelProps) {
  const [researchPending, setResearchPending] = useState(false);

  async function handleRunResearch() {
    if (!lead) return;
    setResearchPending(true);
    // Wired in Step 8
    await new Promise((r) => setTimeout(r, 800));
    setResearchPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[90vw] lg:w-[65vw] p-0 overflow-hidden"
      >
        {lead && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <SheetHeader className="px-6 py-4 border-b shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <SheetTitle className="text-xl font-bold leading-tight">
                    {lead.full_name}
                  </SheetTitle>
                  {(lead.title || lead.company_name) && (
                    <p className="text-sm text-muted-foreground">
                      {[lead.title, lead.company_name]
                        .filter(Boolean)
                        .join(" at ")}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <StatusBadge status={lead.status} />
                    {lead.linkedin_url && (
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Link2 className="h-3 w-3" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {lead.email && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden divide-x">
              {/* Left column — Dossier */}
              <ScrollArea className="flex-1 p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Research Dossier</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRunResearch}
                      disabled={researchPending}
                    >
                      {researchPending ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FlaskConical className="mr-2 h-3.5 w-3.5" />
                      )}
                      {lead.dossier ? "Re-run research" : "Run research"}
                    </Button>
                  </div>

                  {lead.dossier ? (
                    <>
                      <CollapsibleSection title="Company summary" defaultOpen>
                        <p>
                          {(lead.dossier as Record<string, string>)
                            .company_summary ?? "—"}
                        </p>
                      </CollapsibleSection>
                      <CollapsibleSection title="Role summary">
                        <p>
                          {(lead.dossier as Record<string, string>)
                            .role_summary ?? "—"}
                        </p>
                      </CollapsibleSection>
                      <CollapsibleSection title="Signals">
                        <p>
                          {(lead.dossier as Record<string, string>).signals ??
                            "—"}
                        </p>
                      </CollapsibleSection>
                      <CollapsibleSection title="Pain hypothesis">
                        <p>
                          {(lead.dossier as Record<string, string>)
                            .pain_hypothesis ?? "—"}
                        </p>
                      </CollapsibleSection>
                      <CollapsibleSection title="Hooks">
                        <p>
                          {(lead.dossier as Record<string, string>).hooks ?? "—"}
                        </p>
                      </CollapsibleSection>
                      <CollapsibleSection title="Fit score">
                        <p>
                          {(lead.dossier as Record<string, string>).fit_score ??
                            "—"}
                          /10
                        </p>
                      </CollapsibleSection>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                      No dossier yet. Click <strong>Run research</strong> to
                      generate one.
                    </div>
                  )}

                  {/* Activity log */}
                  <Separator className="my-4" />
                  <h3 className="text-sm font-semibold">Activity</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0 mt-1.5" />
                      <span>
                        Lead added{" "}
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Right column — Drafts */}
              <ScrollArea className="flex-1 p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Drafts</h3>
                    <Button size="sm" variant="outline" disabled={!lead.dossier}>
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      Generate drafts
                    </Button>
                  </div>

                  <DraftCard
                    title="Email"
                    content={
                      (lead.drafts as Record<string, string> | null)?.email
                    }
                  />
                  <DraftCard
                    title="LinkedIn connection note"
                    charLimit={300}
                    content={
                      (lead.drafts as Record<string, string> | null)
                        ?.linkedin_connection
                    }
                  />
                  <DraftCard
                    title="LinkedIn DM"
                    content={
                      (lead.drafts as Record<string, string> | null)
                        ?.linkedin_dm
                    }
                  />
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
