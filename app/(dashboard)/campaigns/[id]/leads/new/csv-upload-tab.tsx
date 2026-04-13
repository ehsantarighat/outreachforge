"use client";

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { importFromCsv, type CsvLead } from "@/app/actions/leads";
import { Loader2, UploadCloud, CheckCircle, X } from "lucide-react";

// Sales Navigator column name variants we auto-detect
const FIELD_HINTS: Record<keyof CsvLead, string[]> = {
  full_name: ["first name", "last name", "full name", "name"],
  title: ["title", "job title", "position"],
  company_name: ["company", "company name", "organization"],
  linkedin_url: ["linkedin", "linkedin url", "profile url", "linkedin profile url"],
  email: ["email", "email address", "work email"],
  location: ["location", "geography", "city", "country"],
};

function guessMapping(headers: string[]): Record<keyof CsvLead, string> {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const result = {} as Record<keyof CsvLead, string>;

  for (const [field, hints] of Object.entries(FIELD_HINTS) as [keyof CsvLead, string[]][]) {
    const match = headers.find((_, i) => hints.some((hint) => lower[i].includes(hint)));
    result[field] = match ?? "";
  }

  return result;
}

function buildLeads(
  rows: Record<string, string>[],
  mapping: Record<keyof CsvLead, string>
): CsvLead[] {
  return rows
    .map((row) => {
      // Special case: Sales Navigator splits first + last name
      let full_name = mapping.full_name ? (row[mapping.full_name] ?? "") : "";
      const firstCol = Object.keys(row).find((k) =>
        k.toLowerCase().includes("first name")
      );
      const lastCol = Object.keys(row).find((k) =>
        k.toLowerCase().includes("last name")
      );
      if (!full_name && firstCol && lastCol) {
        full_name = `${row[firstCol] ?? ""} ${row[lastCol] ?? ""}`.trim();
      }

      return {
        full_name: full_name.trim(),
        title: mapping.title ? (row[mapping.title] ?? "") : "",
        company_name: mapping.company_name ? (row[mapping.company_name] ?? "") : "",
        linkedin_url: mapping.linkedin_url ? (row[mapping.linkedin_url] ?? "") : "",
        email: mapping.email ? (row[mapping.email] ?? "") : "",
        location: mapping.location ? (row[mapping.location] ?? "") : "",
      };
    })
    .filter((l) => l.full_name);
}

export function CsvUploadTab({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  // Parsed state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<keyof CsvLead, string>>({} as Record<keyof CsvLead, string>);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ inserted?: number; skipped?: number; error?: string } | null>(null);

  function parseFile(file: File) {
    setFileName(file.name);
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const h = results.meta.fields ?? [];
        setHeaders(h);
        setRows(results.data.slice(0, 500)); // cap at 500 for preview safety
        setMapping(guessMapping(h));
      },
    });
  }

  function handleFile(file: File | undefined) {
    if (!file || !file.name.endsWith(".csv")) return;
    parseFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleImport() {
    const leads = buildLeads(rows, mapping);
    if (leads.length === 0) {
      setResult({ error: "No valid leads found with the current mapping." });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await importFromCsv(campaignId, leads);
      setResult(res);
      if (res.inserted && res.inserted > 0) {
        router.push(`/campaigns/${campaignId}`);
      }
    });
  }

  function reset() {
    setHeaders([]);
    setRows([]);
    setMapping({} as Record<keyof CsvLead, string>);
    setFileName("");
    setResult(null);
  }

  const FIELD_LABELS: Record<keyof CsvLead, string> = {
    full_name: "Full name *",
    title: "Job title",
    company_name: "Company",
    linkedin_url: "LinkedIn URL",
    email: "Email",
    location: "Location",
  };

  const preview = buildLeads(rows.slice(0, 10), mapping);

  if (headers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV</CardTitle>
          <CardDescription>
            Accepts Sales Navigator exports. Columns are auto-detected — you
            can adjust the mapping after upload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop a CSV file here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File info + reset */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
        <div className="text-sm">
          <span className="font-medium">{fileName}</span>
          <span className="ml-2 text-muted-foreground">
            {rows.length} row{rows.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="mr-1 h-4 w-4" />
          Remove
        </Button>
      </div>

      {/* Column mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Column mapping</CardTitle>
          <CardDescription>
            We auto-detected the mapping below. Adjust if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(FIELD_LABELS) as (keyof CsvLead)[]).map((field) => (
              <div key={field} className="space-y-1.5">
                <Label>{FIELD_LABELS[field]}</Label>
                <Select
                  value={mapping[field] ?? ""}
                  onValueChange={(v) =>
                    setMapping((m) => ({ ...m, [field]: v ?? "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— not mapped —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— not mapped —</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Preview (first {preview.length} rows)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  {(["full_name", "title", "company_name", "linkedin_url"] as const).map(
                    (f) => (
                      <th
                        key={f}
                        className="px-4 py-2 text-left font-medium text-muted-foreground"
                      >
                        {FIELD_LABELS[f]}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.map((lead, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2">{lead.full_name || "—"}</td>
                    <td className="max-w-[160px] truncate px-4 py-2 text-muted-foreground">
                      {lead.title || "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {lead.company_name || "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2 font-mono text-xs text-muted-foreground">
                      {lead.linkedin_url || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
      {result?.inserted !== undefined && !result.error && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          {result.inserted} lead{result.inserted !== 1 ? "s" : ""} imported
          {result.skipped ? `, ${result.skipped} duplicate${result.skipped !== 1 ? "s" : ""} skipped` : ""}.
        </div>
      )}

      <Button onClick={handleImport} disabled={isPending || preview.length === 0}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Import {rows.length} lead{rows.length !== 1 ? "s" : ""}
      </Button>
    </div>
  );
}
