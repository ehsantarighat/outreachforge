"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  UserPlus,
  LayoutGrid,
  List,
  Search,
  Trash2,
  FlaskConical,
  Sparkles,
  Eye,
} from "lucide-react";
import type { Lead } from "@/app/actions/leads";
import { deleteLead } from "@/app/actions/leads";
import { LeadDetailPanel } from "./lead-detail-panel";

// ─── Shared status config ─────────────────────────────────────────────────────

const STATUSES = [
  "new",
  "researched",
  "drafted",
  "approved",
  "sent",
  "replied",
  "meeting",
  "won",
  "lost",
] as const;

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

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Table view ───────────────────────────────────────────────────────────────

function LeadRow({
  lead,
  onView,
  onDelete,
}: {
  lead: Lead;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={onView}
    >
      <TableCell className="font-medium">{lead.full_name}</TableCell>
      <TableCell className="text-muted-foreground">{lead.title ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{lead.company_name ?? "—"}</TableCell>
      <TableCell>
        <StatusPill status={lead.status} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {timeAgo(lead.updated_at)}
      </TableCell>
      <TableCell
        onClick={(e) => e.stopPropagation()}
        className="w-10 text-right"
      >
        <LeadKebab onView={onView} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}

function LeadKebab({
  onView,
  onDelete,
}: {
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[popup-open]:bg-muted">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Lead actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          View detail
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <FlaskConical className="mr-2 h-4 w-4" />
          Research
          <span className="ml-auto text-xs text-muted-foreground">Step 8</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Sparkles className="mr-2 h-4 w-4" />
          Draft
          <span className="ml-auto text-xs text-muted-foreground">Step 9</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Kanban view ──────────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  leads,
  onView,
  onDelete,
}: {
  status: string;
  leads: Lead[];
  onView: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  return (
    <div className="flex flex-col gap-2 min-w-[220px] max-w-[240px]">
      <div className="flex items-center justify-between mb-1">
        <StatusPill status={status} />
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      {leads.length === 0 ? (
        <div className="rounded-lg border border-dashed h-20 flex items-center justify-center text-xs text-muted-foreground">
          Empty
        </div>
      ) : (
        leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onView(lead)}
            className="rounded-lg border bg-card p-3 cursor-pointer hover:shadow-sm transition-shadow group"
          >
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{lead.full_name}</p>
                {lead.title && (
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.title}
                  </p>
                )}
                {lead.company_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.company_name}
                  </p>
                )}
              </div>
              <div
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <LeadKebab
                  onView={() => onView(lead)}
                  onDelete={() => onDelete(lead)}
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {timeAgo(lead.updated_at)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Status filter button ─────────────────────────────────────────────────────

function StatusFilter({
  selected,
  onChange,
}: {
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  function toggle(status: string) {
    const next = new Set(selected);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => toggle(s)}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-all ${
            selected.has(s)
              ? `${STATUS_COLORS[s]} ring-1 ring-current`
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── Main pipeline tab ────────────────────────────────────────────────────────

export function PipelineTab({
  campaignId,
  initialLeads,
}: {
  campaignId: string;
  initialLeads: Lead[];
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = leads;
    if (statusFilter.size > 0) {
      list = list.filter((l) => statusFilter.has(l.status));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.full_name.toLowerCase().includes(q) ||
          l.company_name?.toLowerCase().includes(q) ||
          l.title?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [leads, statusFilter, search]);

  function openDetail(lead: Lead) {
    setSelectedLead(lead);
    setPanelOpen(true);
  }

  function confirmDelete(lead: Lead) {
    setDeleteTarget(lead);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setDeleteTarget(null);
    if (selectedLead?.id === id) setPanelOpen(false);
    startTransition(async () => {
      await deleteLead(id, campaignId);
    });
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground mb-4">No leads yet</p>
        <Button nativeButton={false} render={<Link href={`/campaigns/${campaignId}/leads/new`} />}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add leads
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Top bar */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or company…"
              className="pl-8"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              nativeButton={false}
              render={<Link href={`/campaigns/${campaignId}/leads/new`} />}
              variant="outline"
              size="sm"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add leads
            </Button>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                type="button"
                onClick={() => setView("table")}
                className={`px-2.5 py-1.5 transition-colors ${
                  view === "table" ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={`px-2.5 py-1.5 transition-colors ${
                  view === "kanban" ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <StatusFilter selected={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Table view */}
      {view === "table" && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10"
                  >
                    No leads match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    onView={() => openDetail(lead)}
                    onDelete={() => confirmDelete(lead)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={filtered.filter((l) => l.status === status)}
                onView={openDetail}
                onDelete={confirmDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lead detail panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.full_name}</strong> and all associated
              dossiers, drafts and activity will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
