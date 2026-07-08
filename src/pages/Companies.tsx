import { useEffect, useState } from "react";
import {
  createCompany,
  deleteCompany,
  listCompanies,
  listContacts,
  updateCompany,
} from "../lib/db";
import type { Company, Contact } from "../lib/types";
import {
  EmptyState,
  Field,
  Modal,
  Spinner,
  TextArea,
  TextInput,
} from "../components/ui";

type Form = Pick<Company, "name" | "website" | "industry" | "notes">;
const emptyForm: Form = { name: "", website: "", industry: "", notes: "" };

export default function Companies() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const [co, c] = await Promise.all([listCompanies(), listContacts()]);
    setCompanies(co);
    setContacts(c);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  const contactCount = (id: string) =>
    contacts.filter((c) => c.company_id === id).length;

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }
  function openEdit(co: Company) {
    setEditing(co);
    setForm({
      name: co.name,
      website: co.website,
      industry: co.industry,
      notes: co.notes,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: Form = {
      name: form.name.trim(),
      website: form.website || null,
      industry: form.industry || null,
      notes: form.notes || null,
    };
    if (editing) await updateCompany(editing.id, payload);
    else await createCompany(payload);
    setSaving(false);
    setModalOpen(false);
    await refresh();
  }

  async function remove(co: Company) {
    if (!confirm(`Delete ${co.name}? Contacts will be kept but unlinked.`))
      return;
    await deleteCompany(co.id);
    await refresh();
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={openNew}>
          + Add company
        </button>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon="▤"
          title="No companies yet"
          subtitle="Group your contacts under the organisations they belong to."
          action={
            <button className="btn-primary" onClick={openNew}>
              + Add your first company
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((co) => (
            <div
              key={co.id}
              className="card group cursor-pointer p-5 transition-shadow hover:shadow-pop"
              onClick={() => openEdit(co)}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-base font-semibold text-brand-700">
                  {co.name[0]?.toUpperCase() ?? "?"}
                </div>
                <button
                  className="btn-danger opacity-0 transition-opacity group-hover:opacity-100 !px-2 !py-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(co);
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="mt-3 font-semibold text-slate-900">{co.name}</div>
              <div className="text-sm text-slate-500">
                {co.industry || "—"}
              </div>
              {co.website && (
                <div className="mt-1 truncate text-sm text-brand-600">
                  {co.website}
                </div>
              )}
              <div className="mt-3 text-xs text-slate-400">
                {contactCount(co.id)} contact
                {contactCount(co.id) === 1 ? "" : "s"}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit company" : "New company"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={save}
              disabled={saving || !form.name.trim()}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add company"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Company name *">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Studios"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <TextInput
                value={form.industry ?? ""}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Design, Retail…"
              />
            </Field>
            <Field label="Website">
              <TextInput
                value={form.website ?? ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="acme.com"
              />
            </Field>
          </div>
          <Field label="Notes">
            <TextArea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything worth remembering about this account…"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
