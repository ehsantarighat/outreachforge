"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Users,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Building2,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { parseLinkedInCsv } from "@/lib/connections/parse-csv";
import { importConnections, deleteConnection } from "@/app/actions/connections";
import type { Connection } from "@/app/actions/connections";

type Stats = { total: number; pending: number; researching: number; done: number };

const CATEGORY_LABELS: Record<string, string> = {
  decision_maker: "Decision Maker",
  founder: "Founder",
  investor: "Investor",
  ic: "Individual Contributor",
  partner: "Partner",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  decision_maker: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  founder: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  investor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  ic: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  partner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  other: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  researching: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function ConnectionsClient({
  connections,
  stats,
}: {
  connections: Connection[];
  stats: Stats;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ─── CSV upload ────────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setImportError("Please upload a CSV file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImportError("File too large. Max 5 MB.");
      return;
    }

    setImporting(true);
    setImportError(null);

    try {
      const text = await file.text();
      const rows = parseLinkedInCsv(text);

      if (rows.length === 0) {
        setImportError(
          "No connections found. Make sure this is a LinkedIn connections export CSV."
        );
        setImporting(false);
        return;
      }

      // Cap at 500 per import
      const capped = rows.slice(0, 500);
      const cappedNote = rows.length > 500 ? ` (capped at 500 per import)` : "";

      const result = await importConnections(capped);

      if (result.error) {
        setImportError(result.error);
      } else {
        toast.success(
          `Imported ${result.imported} connection${result.imported !== 1 ? "s" : ""}${cappedNote}` +
            (result.skipped > 0 ? ` — ${result.skipped} duplicate${result.skipped !== 1 ? "s" : ""} skipped` : "")
        );
        startTransition(() => router.refresh());
      }
    } catch {
      setImportError("Failed to parse CSV. Please check the file format.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteConnection(deleteId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Connection deleted");
      startTransition(() => router.refresh());
    }
    setDeleteId(null);
  }

  // ─── Filter ────────────────────────────────────────────────────────────────

  const filtered = connections.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.full_name.toLowerCase().includes(q) &&
        !(c.company_name ?? "").toLowerCase().includes(q) &&
        !(c.position ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  // ─── Empty state ───────────────────────────────────────────────────────────

  if (connections.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader stats={stats} onUpload={() => fileInputRef.current?.click()} importing={importing} />
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

        {importError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No connections yet</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Export your LinkedIn connections and upload the CSV. Go to{" "}
            <strong>LinkedIn → Settings → Data Privacy → Get a copy of your data → Connections</strong>.
          </p>
          <Button onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload connections CSV
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader stats={stats} onUpload={() => fileInputRef.current?.click()} importing={importing} />
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, company, position…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="researching">Researching</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Fit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No connections match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.full_name}</span>
                      {c.linkedin_url && (
                        <a
                          href={c.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    {c.email && (
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      {c.company_name ? (
                        <>
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {c.company_name}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      {c.position ? (
                        <>
                          <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {c.position}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.category ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[c.category]}`}>
                        {CATEGORY_LABELS[c.category]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.fit_score != null ? (
                      <span className={`text-sm font-semibold ${
                        c.fit_score >= 7 ? "text-green-600 dark:text-green-400"
                        : c.fit_score >= 4 ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                      }`}>
                        {c.fit_score}/10
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {c.status === "researching" && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {connections.length} connections
      </p>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the connection and any research data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

function PageHeader({
  onUpload,
  importing,
}: {
  stats: Stats;
  onUpload: () => void;
  importing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import your LinkedIn connections and research them to find the best prospects.
        </p>
      </div>
      <Button onClick={onUpload} disabled={importing} className="shrink-0">
        {importing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Import CSV
      </Button>
    </div>
  );
}
