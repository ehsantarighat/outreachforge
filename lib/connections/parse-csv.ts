import type { CsvRow } from "@/app/actions/connections";

/**
 * Parses a LinkedIn connections CSV export.
 *
 * LinkedIn's export format (as of 2024):
 *   First Name,Last Name,URL,Email Address,Company,Position,Connected On
 *
 * We also handle variations where columns may be in different order or
 * have slightly different names.
 */
export function parseLinkedInCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  // LinkedIn sometimes has a note block at the top before the header row.
  // Find the header row (contains "First Name" or "URL").
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("first name") || lower.includes("url")) {
      headerIdx = i;
      break;
    }
  }

  const headers = parseCsvLine(lines[headerIdx]).map((h) =>
    h.trim().toLowerCase()
  );

  const col = (name: string): number => {
    const aliases: Record<string, string[]> = {
      first_name: ["first name", "firstname"],
      last_name: ["last name", "lastname"],
      url: ["url", "linkedin url", "profile url"],
      email: ["email address", "email"],
      company: ["company", "company name"],
      position: ["position", "title", "job title"],
      connected_on: ["connected on", "connected date"],
    };
    if (name in aliases) {
      for (const alias of aliases[name]) {
        const idx = headers.indexOf(alias);
        if (idx !== -1) return idx;
      }
    }
    // direct match
    const idx = headers.indexOf(name);
    return idx;
  };

  const firstNameIdx = col("first_name");
  const lastNameIdx = col("last_name");
  const urlIdx = col("url");
  const emailIdx = col("email");
  const companyIdx = col("company");
  const positionIdx = col("position");
  const connectedOnIdx = col("connected_on");

  const rows: CsvRow[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 2) continue;

    const get = (idx: number) =>
      idx >= 0 && idx < cells.length ? cells[idx].trim() || null : null;

    const firstName = get(firstNameIdx) ?? "";
    const lastName = get(lastNameIdx) ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";

    rows.push({
      full_name: fullName,
      first_name: firstName || null,
      last_name: lastName || null,
      email: get(emailIdx),
      company_name: get(companyIdx),
      position: get(positionIdx),
      linkedin_url: normalizeUrl(get(urlIdx)),
      connected_on: parseDate(get(connectedOnIdx)),
    });
  }

  return rows.filter((r) => r.full_name !== "Unknown" || r.linkedin_url);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Ensure it starts with https://
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("linkedin.com")) return `https://${trimmed}`;
  return trimmed;
}

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  // LinkedIn format: "01 Jan 2024" or "2024-01-01"
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}
