import type { ContactStatus } from "./types";
import type { ContactInput } from "./db";

/**
 * Spreadsheet import helpers. SheetJS is loaded lazily (dynamic import) so it
 * only enters the bundle when someone actually opens the importer.
 */

export const IMPORT_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "company", label: "Company", required: false },
  { key: "status", label: "Status", required: false },
  { key: "tags", label: "Tags", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

export type FieldKey = (typeof IMPORT_FIELDS)[number]["key"];
export type ColumnMap = Record<FieldKey, string | null>;

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

const STATUS_ALIASES: Record<string, ContactStatus> = {
  lead: "lead",
  prospect: "lead",
  new: "lead",
  active: "active",
  contacted: "active",
  "in progress": "active",
  customer: "customer",
  client: "customer",
  won: "customer",
  closed: "customer",
  inactive: "inactive",
  lost: "inactive",
  archived: "inactive",
};

/** Read a File (.xlsx/.xls/.csv) into headers + row objects. */
export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { headers: [], rows: [] };

  const matrix = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
  if (!matrix.length) return { headers: [], rows: [] };

  // First non-empty row is the header. De-duplicate blank/duplicate headers.
  const rawHeaders = (matrix[0] as unknown[]).map((h) => String(h ?? "").trim());
  const seen: Record<string, number> = {};
  const headers = rawHeaders.map((h, i) => {
    const base = h || `Column ${i + 1}`;
    if (seen[base] === undefined) {
      seen[base] = 0;
      return base;
    }
    seen[base] += 1;
    return `${base} (${seen[base]})`;
  });

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r] as unknown[];
    const obj: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((h, i) => {
      const v = String(row[i] ?? "").trim();
      obj[h] = v;
      if (v) hasValue = true;
    });
    if (hasValue) rows.push(obj);
  }

  // Common export shape: separate First/Last name and no single Name column.
  // Synthesize a combined "Name" column so auto-mapping just works.
  const lower = headers.map((h) => h.toLowerCase());
  const hasFull = lower.some((h) => h === "name" || h.includes("full name"));
  const firstIdx = lower.findIndex((h) => h.includes("first"));
  const lastIdx = lower.findIndex((h) => h.includes("last"));
  if (!hasFull && firstIdx !== -1 && lastIdx !== -1) {
    const col = "Name";
    headers.push(col);
    for (const row of rows) {
      row[col] = `${row[headers[firstIdx]] ?? ""} ${
        row[headers[lastIdx]] ?? ""
      }`.trim();
    }
  }

  return { headers, rows };
}

/** Guess which spreadsheet column feeds each field, from header names. */
export function autoMap(headers: string[]): ColumnMap {
  const find = (matchers: ((h: string) => boolean)[]) =>
    headers.find((h) => {
      const l = h.toLowerCase();
      return matchers.some((m) => m(l));
    }) ?? null;

  return {
    name: find([
      (h) => h === "name",
      (h) => h.includes("full name"),
      (h) => h.includes("contact name"),
      (h) => h === "contact",
    ]),
    email: find([(h) => h.includes("email"), (h) => h.includes("e-mail")]),
    phone: find([
      (h) => h.includes("phone"),
      (h) => h.includes("mobile"),
      (h) => h.includes("tel"),
    ]),
    company: find([
      (h) => h.includes("company"),
      (h) => h.includes("organisation"),
      (h) => h.includes("organization"),
      (h) => h.includes("account"),
    ]),
    status: find([(h) => h.includes("status"), (h) => /\bstage\b/.test(h)]),
    tags: find([(h) => /\btags?\b/.test(h), (h) => /\blabels?\b/.test(h)]),
    notes: find([
      (h) => h.includes("note"),
      (h) => h.includes("comment"),
      (h) => h.includes("description"),
    ]),
  };
}

export function normalizeStatus(value: string): ContactStatus {
  const key = value.trim().toLowerCase();
  return STATUS_ALIASES[key] ?? "lead";
}

export interface BuildResult {
  contacts: (ContactInput & { _company: string })[];
  skipped: number;
}

/**
 * Turn parsed rows + a column map into contact drafts. Company is kept as a
 * name string (`_company`) to be resolved to an id at import time. Rows with
 * no name are skipped and counted.
 */
export function buildDrafts(rows: Record<string, string>[], map: ColumnMap): BuildResult {
  const get = (row: Record<string, string>, key: FieldKey) =>
    map[key] ? (row[map[key] as string] ?? "").trim() : "";

  const contacts: (ContactInput & { _company: string })[] = [];
  let skipped = 0;

  for (const row of rows) {
    const name = get(row, "name");
    if (!name) {
      skipped++;
      continue;
    }
    const tagsRaw = get(row, "tags");
    contacts.push({
      name,
      email: get(row, "email") || null,
      phone: get(row, "phone") || null,
      company_id: null,
      status: map.status ? normalizeStatus(get(row, "status")) : "lead",
      tags: tagsRaw
        ? tagsRaw
            .split(/[,;|]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      notes: get(row, "notes") || null,
      _company: get(row, "company"),
    });
  }
  return { contacts, skipped };
}

/** Generate and download a starter template the user can fill in. */
export async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const rows = [
    {
      Name: "Jordan Reyes",
      Email: "jordan@acme.example",
      Phone: "+1 555 0142",
      Company: "Acme Studios",
      Status: "lead",
      Tags: "website, priority",
      Notes: "Interested in a brand refresh",
    },
    {
      Name: "Marcus Bell",
      Email: "marcus@northwind.co",
      Phone: "+1 555 0199",
      Company: "Northwind",
      Status: "customer",
      Tags: "referral",
      Notes: "",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");
  XLSX.writeFile(wb, "kobis-connect-import-template.xlsx");
}
