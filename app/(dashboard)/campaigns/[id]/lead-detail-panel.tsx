"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
import { refreshLead, updateDossier } from "@/app/actions/leads";
import type { DossierSchema } from "@/lib/prompts/research";

// ─── Status ───────────────────────────────────────────────────────────────────

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

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border overflow-hidden">
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
      {open && <div className="px-4 py-3 border-t text-sm">{children}</div>}
    </div>
  );
}

// ─── Inline editable field ────────────────────────────────────────────────────

function EditableText({
  value,
  onSave,
  rows = 3,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);

  return (
    <Textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onSave(local); }}
      rows={rows}
      placeholder={placeholder}
      className="text-sm resize-none border-transparent bg-transparent focus:border-input focus:bg-background transition-colors"
    />
  );
}

// ─── Fit score badge ──────────────────────────────────────────────────────────

function FitScore({ score }: { score: number }) {
  const color =
    score >= 4 ? "text-green-600" : score >= 3 ? "text-yellow-600" : "text-red-500";
  return (
    <span className={`text-2xl font-bold ${color}`}>
      {score}<span className="text-base font-normal text-muted-foreground">/5</span>
    </span>
  );
}

// ─── Dossier panel ────────────────────────────────────────────────────────────

function DossierPanel({
  lead,
  onLeadUpdated,
}: {
  lead: Lead;
  onLeadUpdated?: (l: Lead) => void;
}) {
  const dossier = (lead.dossier as DossierSchema | null) ?? null;

  const save = useCallback(
    async (patch: Partial<DossierSchema>) => {
      if (!dossier) return;
      const next = { ...dossier, ...patch };
      const res = await updateDossier(lead.id, next as Record<string, unknown>);
      if (res.error) toast.error("Save failed: " + res.error);
      else onLeadUpdated?.({ ...lead, dossier: next });
    },
    [dossier, lead, onLeadUpdated]
  );

  if (!dossier) {
    if (lead.status === "researched") {
      return (
        <div className="rounded-lg border border-dashed bg-blue-500/5 py-10 text-center text-sm text-blue-600 dark:text-blue-400">
          <p className="font-medium">Research complete ✓</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Reopen the panel — dossier should appear shortly.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
        No dossier yet. Click <strong>Run research</strong> to generate one.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Fit score */}
      <div className="rounded-lg border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Fit score
          </p>
          <FitScore score={dossier.fit_score} />
        </div>
        <div className="text-xs text-muted-foreground max-w-[60%] text-right leading-relaxed">
          {dossier.fit_reasoning}
        </div>
        <span className={`ml-3 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          dossier.research_quality === "rich"
            ? "bg-green-500/15 text-green-600"
            : dossier.research_quality === "adequate"
            ? "bg-yellow-500/15 text-yellow-600"
            : "bg-red-500/15 text-red-600"
        }`}>
          {dossier.research_quality}
        </span>
      </div>

      <Section title="Company summary" defaultOpen>
        <EditableText
          value={dossier.company_summary}
          onSave={(v) => save({ company_summary: v })}
          placeholder="Company summary…"
        />
      </Section>

      <Section title="Role summary" defaultOpen>
        <EditableText
          value={dossier.role_summary}
          onSave={(v) => save({ role_summary: v })}
          placeholder="Role summary…"
        />
      </Section>

      <Section title="Pain hypothesis" defaultOpen>
        <EditableText
          value={dossier.pain_hypothesis}
          onSave={(v) => save({ pain_hypothesis: v })}
          placeholder="Pain hypothesis…"
        />
      </Section>

      <Section title={`Signals (${dossier.signals.length})`}>
        <EditableText
          value={dossier.signals.join("\n")}
          onSave={(v) =>
            save({ signals: v.split("\n").filter((s) => s.trim()) })
          }
          rows={Math.max(3, dossier.signals.length + 1)}
          placeholder="One signal per line…"
        />
        <p className="mt-1 text-xs text-muted-foreground">One signal per line</p>
      </Section>

      <Section title={`Hooks (${dossier.hooks.length})`} defaultOpen>
        <div className="space-y-3">
          {dossier.hooks.map((h, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Hook {i + 1}</p>
              <EditableText
                value={h.hook}
                onSave={(v) => {
                  const hooks = [...dossier.hooks];
                  hooks[i] = { ...hooks[i], hook: v };
                  save({ hooks });
                }}
                rows={2}
                placeholder="Hook idea…"
              />
              <EditableText
                value={h.rationale}
                onSave={(v) => {
                  const hooks = [...dossier.hooks];
                  hooks[i] = { ...hooks[i], rationale: v };
                  save({ hooks });
                }}
                rows={2}
                placeholder="Why this resonates…"
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Draft card ───────────────────────────────────────────────────────────────

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
          <span className={`text-xs ${overLimit ? "text-red-500" : "text-muted-foreground"}`}>
            {text.length}{charLimit ? `/${charLimit}` : ""} chars
          </span>
        )}
      </div>
      <div className="min-h-[80px] rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground italic">
        {text || "No draft yet — click Generate drafts to create one."}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={!text}>Approve</Button>
        <Button size="sm" variant="ghost" disabled>Regenerate</Button>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface LeadDetailPanelProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onLeadUpdated?: (lead: Lead) => void;
  onResearchStarted?: (leadId: string) => void;
}

export function LeadDetailPanel({
  lead,
  open,
  onClose,
  onLeadUpdated,
  onResearchStarted,
}: LeadDetailPanelProps) {
  const [researchPending, setResearchPending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [lead?.id]);

  async function handleRunResearch() {
    if (!lead) return;
    setResearchPending(true);

    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });

    if (!res.ok) {
      setResearchPending(false);
      toast.error("Failed to start research. Check the server logs.");
      return;
    }

    onResearchStarted?.(lead.id);

    const poll = async () => {
      const updated = await refreshLead(lead.id);
      if (updated && updated.status !== "new") {
        setResearchPending(false);
        onLeadUpdated?.(updated);
        toast.success(`Research complete for ${updated.full_name}`, {
          description: updated.dossier
            ? `Fit score: ${(updated.dossier as Record<string, number>).fit_score}/5`
            : "Dossier ready.",
        });
      } else {
        pollRef.current = setTimeout(poll, 2000);
      }
    };
    pollRef.current = setTimeout(poll, 2000);
  }

  const drafts = lead?.drafts as Record<string, Record<string, string>> | null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="!w-[min(65vw,900px)] !max-w-none p-0 overflow-hidden"
      >
        {lead && (
          <div className="flex flex-1 min-h-0 flex-col">
            {/* Header */}
            <SheetHeader className="px-6 py-4 border-b shrink-0">
              <div className="space-y-1">
                <SheetTitle className="text-xl font-bold leading-tight">
                  {lead.full_name}
                </SheetTitle>
                {(lead.title || lead.company_name) && (
                  <p className="text-sm text-muted-foreground">
                    {[lead.title, lead.company_name].filter(Boolean).join(" at ")}
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
                      <Link2 className="h-3 w-3" />LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {lead.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />{lead.email}
                    </span>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden divide-x">
              {/* Left — Dossier */}
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

                  <DossierPanel key={lead.id} lead={lead} onLeadUpdated={onLeadUpdated} />

                  <Separator className="my-4" />
                  <h3 className="text-sm font-semibold">Activity</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                      <span>Lead added {new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Right — Drafts */}
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
                    content={drafts?.email?.body}
                  />
                  <DraftCard
                    title="LinkedIn connection note"
                    charLimit={300}
                    content={drafts?.linkedin_connect?.note}
                  />
                  <DraftCard
                    title="LinkedIn DM"
                    content={drafts?.linkedin_dm?.message}
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
