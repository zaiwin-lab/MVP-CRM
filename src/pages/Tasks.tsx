import { useEffect, useMemo, useState } from "react";
import {
  createTask,
  deleteTask,
  listContacts,
  listTasks,
  toggleTask,
} from "../lib/db";
import type { Contact, Task } from "../lib/types";
import {
  EmptyState,
  Field,
  Modal,
  Select,
  Spinner,
  TextInput,
} from "../components/ui";
import { TasksIcon, PlusIcon, TrashIcon } from "../components/icons";
import { useToast } from "../context/ToastContext";
import { useHotkeys } from "../lib/useHotkeys";

const today = () => new Date().toISOString().slice(0, 10);

function groupLabel(due: string | null): string {
  if (!due) return "No date";
  const t = today();
  if (due < t) return "Overdue";
  if (due === t) return "Today";
  return "Upcoming";
}

const GROUP_ORDER = ["Overdue", "Today", "Upcoming", "No date"];
const GROUP_STYLES: Record<string, string> = {
  Overdue: "text-red-600",
  Today: "text-amber-600",
  Upcoming: "text-slate-500",
  "No date": "text-slate-400",
};

export default function Tasks() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(today());
  const [contactId, setContactId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const [t, c] = await Promise.all([listTasks(), listContacts()]);
      setTasks(t);
      setContacts(c);
    } catch {
      toast.error("Couldn't load tasks. Check your connection.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contactName = (id: string | null) =>
    contacts.find((c) => c.id === id)?.name;

  const visible = useMemo(
    () => tasks.filter((t) => showDone || !t.done),
    [tasks, showDone]
  );

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of visible) {
      const g = t.done ? "Done" : groupLabel(t.due_date);
      (map[g] ??= []).push(t);
    }
    return map;
  }, [visible]);

  const order = showDone ? [...GROUP_ORDER, "Done"] : GROUP_ORDER;

  function openNew() {
    setTitle("");
    setDueDate(today());
    setContactId("");
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
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await createTask({
        title: title.trim(),
        due_date: dueDate || null,
        contact_id: contactId || null,
      });
      toast.success("Task added");
      setModalOpen(false);
      await refresh();
    } catch {
      toast.error("Couldn't save the task. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(t: Task) {
    try {
      await toggleTask(t.id, !t.done);
      await refresh();
      if (!t.done) toast.success(`Completed: ${t.title}`);
    } catch {
      toast.error("Couldn't update the task.");
    }
  }

  async function remove(t: Task) {
    try {
      await deleteTask(t.id);
      await refresh();
      toast.success("Task deleted", {
        label: "Undo",
        onClick: async () => {
          try {
            await createTask({
              title: t.title,
              due_date: t.due_date,
              contact_id: t.contact_id,
            });
            await refresh();
          } catch {
            toast.error("Couldn't restore the task.");
          }
        },
      });
    } catch {
      toast.error("Couldn't delete the task.");
    }
  }

  if (loading) return <Spinner />;

  const openCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Show completed
        </label>
        <button className="btn-primary" onClick={openNew}>
          <PlusIcon size={16} /> New task
        </button>
      </div>

      {openCount === 0 && !showDone ? (
        <EmptyState
          icon={<TasksIcon size={22} />}
          title="No open follow-ups"
          subtitle="Create a task to remind yourself to call, email, or send a proposal."
          action={
            <button className="btn-primary" onClick={openNew}>
              <PlusIcon size={16} /> New task
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {order.map((group) => {
            const items = grouped[group];
            if (!items?.length) return null;
            return (
              <div key={group}>
                <div
                  className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
                    GROUP_STYLES[group] ?? "text-slate-400"
                  }`}
                >
                  {group}
                  <span className="tnum rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {items.length}
                  </span>
                </div>
                <div className="card divide-y divide-slate-50">
                  {items.map((t) => {
                    const name = contactName(t.contact_id);
                    return (
                      <div
                        key={t.id}
                        className="group flex items-center gap-3 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={() => onToggle(t)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-sm ${
                              t.done
                                ? "text-slate-400 line-through"
                                : "font-medium text-slate-800"
                            }`}
                          >
                            {t.title}
                          </div>
                          <div className="flex gap-2 text-xs text-slate-500">
                            {t.due_date && <span className="tnum">{t.due_date}</span>}
                            {name && <span>· {name}</span>}
                          </div>
                        </div>
                        <button
                          className="btn-danger !px-2 !py-1 text-xs opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                          onClick={() => remove(t)}
                          aria-label="Delete task"
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={save}
        title="New task"
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
              disabled={saving || !title.trim()}
            >
              {saving ? "Saving…" : "Add task"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="What needs doing? *">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Call Jordan about the proposal"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Due date">
              <TextInput
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
            <Field label="Related contact">
              <Select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              >
                <option value="">— None —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
