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
import { CompaniesIcon, PlusIcon, TrashIcon } from "../components/icons";
import { useToast } from "../context/ToastContext";
import { useHotkeys } from "../lib/useHotkeys";

type Form = Pick<Company, "name" | "website" | "industry" | "notes">;
const emptyForm: Form = { name: "", website: "", industry: "", notes: "" };

export default function Companies() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const [co, c] = await Promise.all([listCompanies(), listContacts()]);
      setCompanies(co);
      setContacts(c);
    } catch {
      toast.error("Couldn't load companies. Check your connection.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useHotkeys(
    {
      n: (e) => {
        e.preventDefault();
        openNew();
      },
    },
    !modalOpen
  );

  async function save() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const payload: Form = {
      name: form.name.trim(),
      website: form.website || null,
      industry: form.industry || null,
      notes: form.notes || null,
    };
    try {
      if (editing) {
        await updateCompany(editing.id, payload);
        toast.success(`Saved ${payload.name}`);
      } else {
        await createCompany(payload);
        toast.success(`Added ${payload.name}`);
      }
      setModalOpen(false);
      await refresh();
    } catch {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(co: Company) {
    try {
      await deleteCompany(co.id);
      await refresh();
      toast.success(`Deleted ${co.name}`, {
        label: "Undo",
        onClick: async () => {
          try {
            await createCompany({
              name: co.name,
              website: co.website,
              industry: co.industry,
              notes: co.notes,
            });
            await refresh();
          } catch {
            toast.error("Couldn't restore the company.");
          }
        },
      });
    } catch {
      toast.error("Couldn't delete. Please try again.");
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={openNew}>
          <PlusIcon size={16} /> Add company
        </button>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon={<CompaniesIcon size={22} />}
          title="No companies yet"
          subtitle="Group your contacts under the organisations they belong to."
          action={
            <button className="btn-primary" onClick={openNew}>
              <PlusIcon size={16} /> Add your first company
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
                  className="btn-danger !px-2 !py-1 text-xs opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(co);
                  }}
                  aria-label={`Delete ${co.name}`}
                >
                  <TrashIcon size={15} />
                </button>
              </div>
              <div className="mt-3 font-semibold text-slate-900">{co.name}</div>
              <div className="text-sm text-slate-500">{co.industry || "—"}</div>
              {co.website && (
                <div className="mt-1 truncate text-sm text-brand-600">
                  {co.website}
                </div>
              )}
              <div className="tnum mt-3 text-xs text-slate-400">
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
        onSubmit={save}
        title={editing ? "Edit company" : "New company"}
        footer={
          <>
            <span className="mr-auto hidden text-xs text-slate-400 sm:block">
              <span className="kbd">⌘</span>
              <span className="kbd ml-1">⏎</span> to save
            </span>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
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
