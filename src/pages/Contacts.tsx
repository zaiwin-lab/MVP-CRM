import { useEffect, useMemo, useState } from "react";
import {
  createContact,
  deleteContact,
  listCompanies,
  listContacts,
  updateContact,
  type ContactInput,
} from "../lib/db";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  type Company,
  type Contact,
  type ContactStatus,
} from "../lib/types";
import {
  Avatar,
  Badge,
  EmptyState,
  Field,
  Modal,
  Select,
  Spinner,
  TextArea,
  TextInput,
} from "../components/ui";

const STATUSES: ContactStatus[] = ["lead", "active", "customer", "inactive"];

const emptyForm: ContactInput = {
  name: "",
  email: "",
  phone: "",
  company_id: null,
  status: "lead",
  tags: [],
  notes: "",
};

export default function Contacts() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const [c, co] = await Promise.all([listContacts(), listCompanies()]);
    setContacts(c);
    setCompanies(co);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  const companyName = (id: string | null) =>
    companies.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        companyName(c.company_id).toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [contacts, companies, query, statusFilter]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setTagsText("");
    setModalOpen(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      company_id: c.company_id,
      status: c.status,
      tags: c.tags,
      notes: c.notes,
    });
    setTagsText(c.tags.join(", "));
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: ContactInput = {
      ...form,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (editing) await updateContact(editing.id, payload);
    else await createContact(payload);
    setSaving(false);
    setModalOpen(false);
    await refresh();
  }

  async function remove(c: Contact) {
    if (!confirm(`Delete ${c.name}? This also removes their tasks.`)) return;
    await deleteContact(c.id);
    await refresh();
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <TextInput
            placeholder="Search name, email, company, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ContactStatus | "all")
            }
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <button className="btn-primary whitespace-nowrap" onClick={openNew}>
          + Add contact
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="☺"
          title={contacts.length === 0 ? "No contacts yet" : "No matches"}
          subtitle={
            contacts.length === 0
              ? "Add your first lead or client to get started."
              : "Try a different search or status filter."
          }
          action={
            contacts.length === 0 ? (
              <button className="btn-primary" onClick={openNew}>
                + Add your first contact
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">
                    Contact
                  </th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">
                    Tags
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="group cursor-pointer hover:bg-slate-50/70"
                    onClick={() => openEdit(c)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <div className="font-medium text-slate-800">
                          {c.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {companyName(c.company_id)}
                    </td>
                    <td className="hidden px-5 py-3 text-slate-500 md:table-cell">
                      <div>{c.email || "—"}</div>
                      {c.phone && (
                        <div className="text-xs text-slate-400">{c.phone}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={STATUS_STYLES[c.status]}>
                        {STATUS_LABELS[c.status]}
                      </Badge>
                    </td>
                    <td className="hidden px-5 py-3 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => (
                          <Badge
                            key={t}
                            className="bg-slate-100 text-slate-600 ring-slate-200"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        className="btn-danger opacity-0 transition-opacity group-hover:opacity-100 !px-2 !py-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(c);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit contact" : "New contact"}
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add contact"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name *">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jordan Reyes"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email">
              <TextInput
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@company.com"
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 0100"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company">
              <Select
                value={form.company_id ?? ""}
                onChange={(e) =>
                  setForm({ ...form, company_id: e.target.value || null })
                }
              >
                <option value="">— None —</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as ContactStatus })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Tags (comma separated)">
            <TextInput
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="website, priority, referral"
            />
          </Field>
          <Field label="Notes">
            <TextArea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Context, next steps, anything useful…"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
