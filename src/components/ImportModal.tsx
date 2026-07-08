import { useRef, useState } from "react";
import { Modal, Select, Badge } from "./ui";
import { UploadIcon, DownloadIcon, FileIcon } from "./icons";
import { useToast } from "../context/ToastContext";
import { bulkCreateContacts, ensureCompaniesByName } from "../lib/db";
import {
  IMPORT_FIELDS,
  autoMap,
  buildDrafts,
  downloadTemplate,
  parseSpreadsheet,
  type ColumnMap,
  type FieldKey,
  type ParsedSheet,
} from "../lib/importContacts";

type Step = "upload" | "map";

export default function ImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState<ParsedSheet>({ headers: [], rows: [] });
  const [map, setMap] = useState<ColumnMap>({} as ColumnMap);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  function reset() {
    setStep("upload");
    setFileName("");
    setSheet({ headers: [], rows: [] });
    setMap({} as ColumnMap);
    setParsing(false);
    setImporting(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseSpreadsheet(file);
      if (!parsed.rows.length) {
        toast.error("That file has no rows we could read.");
        setParsing(false);
        return;
      }
      setSheet(parsed);
      setMap(autoMap(parsed.headers));
      setStep("map");
    } catch {
      toast.error("Couldn't read that file. Use .xlsx or .csv.");
    } finally {
      setParsing(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  async function runImport() {
    const { contacts, skipped } = buildDrafts(sheet.rows, map);
    if (!contacts.length) {
      toast.error("No rows have a name to import.");
      return;
    }
    setImporting(true);
    try {
      const companyNames = contacts.map((c) => c._company).filter(Boolean);
      const companyMap = companyNames.length
        ? await ensureCompaniesByName(companyNames)
        : {};
      const payload = contacts.map(({ _company, ...c }) => ({
        ...c,
        company_id: _company ? companyMap[_company.toLowerCase()] ?? null : null,
      }));
      await bulkCreateContacts(payload);
      toast.success(
        `Imported ${payload.length} contact${payload.length === 1 ? "" : "s"}` +
          (skipped ? ` · skipped ${skipped} without a name` : "")
      );
      onImported();
      close();
    } catch {
      toast.error("Import failed. Please try again.");
      setImporting(false);
    }
  }

  const nameMapped = Boolean(map.name);
  const importable = nameMapped
    ? sheet.rows.filter((r) => (r[map.name as string] ?? "").trim())
    : [];
  const willImport = importable.length;
  const previewRows = importable.slice(0, 5);

  return (
    <Modal
      open={open}
      onClose={close}
      onSubmit={step === "map" && nameMapped ? runImport : undefined}
      title="Import contacts"
      footer={
        step === "upload" ? (
          <>
            <button
              className="btn-ghost mr-auto gap-2 !px-2 text-sm"
              onClick={() => downloadTemplate()}
            >
              <DownloadIcon size={15} /> Download template
            </button>
            <button className="btn-secondary" onClick={close}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-ghost mr-auto !px-2 text-sm"
              onClick={reset}
            >
              ← Choose another file
            </button>
            <button className="btn-secondary" onClick={close}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={runImport}
              disabled={!nameMapped || importing || willImport === 0}
            >
              {importing
                ? "Importing…"
                : `Import ${willImport} contact${willImport === 1 ? "" : "s"}`}
            </button>
          </>
        )
      }
    >
      {step === "upload" ? (
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragOver
                ? "border-brand-400 bg-brand-50"
                : "border-slate-300 hover:border-brand-300 hover:bg-slate-50"
            }`}
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <UploadIcon size={22} />
            </div>
            <div className="text-sm font-medium text-slate-800">
              {parsing ? "Reading your file…" : "Drop a file here, or click to browse"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Excel (.xlsx) or CSV · the first row should be column headers
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={onPick}
          />
          <p className="text-xs text-slate-500">
            New to this? Download the template above, fill in your contacts, and
            upload it back. We'll match the columns automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <FileIcon size={16} />
            <span className="truncate">{fileName}</span>
            <Badge className="ml-auto bg-slate-100 text-slate-600 ring-slate-200">
              {sheet.rows.length} rows
            </Badge>
          </div>

          {/* Column mapping */}
          <div>
            <div className="mb-2 text-xs font-medium text-slate-600">
              Match your columns to contact fields
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {IMPORT_FIELDS.map((field) => (
                <label key={field.key} className="flex items-center gap-2">
                  <span className="w-20 flex-shrink-0 text-sm text-slate-600">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </span>
                  <Select
                    value={map[field.key] ?? ""}
                    onChange={(e) =>
                      setMap({
                        ...map,
                        [field.key as FieldKey]: e.target.value || null,
                      })
                    }
                    className="!py-1.5 text-sm"
                  >
                    <option value="">— Not imported —</option>
                    {sheet.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            </div>
            {!nameMapped && (
              <p className="mt-2 text-xs text-red-600">
                Pick which column holds the contact's name to continue.
              </p>
            )}
          </div>

          {/* Preview */}
          {nameMapped && (
            <div>
              <div className="mb-2 text-xs font-medium text-slate-600">
                Preview · first {previewRows.length} of {willImport} to import
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {IMPORT_FIELDS.filter((f) => map[f.key]).map((f) => (
                        <th key={f.key} className="whitespace-nowrap px-3 py-2 font-medium">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {IMPORT_FIELDS.filter((f) => map[f.key]).map((f) => (
                          <td
                            key={f.key}
                            className="max-w-[160px] truncate px-3 py-2 text-slate-700"
                          >
                            {row[map[f.key] as string] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                New companies will be created automatically and linked. Unknown
                statuses default to “Lead”.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
