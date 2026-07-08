import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  listActivity,
  listContacts,
  listCompanies,
  listTasks,
} from "../lib/db";
import type { Activity, Contact, Task } from "../lib/types";
import { Spinner } from "../components/ui";
import { useToast } from "../context/ToastContext";
import {
  ContactsIcon,
  CompaniesIcon,
  TasksIcon,
  CheckIcon,
  ArrowRightIcon,
  PlusIcon,
} from "../components/icons";

const ACTIVITY_ICON: Record<string, ReactNode> = {
  contact_created: <ContactsIcon size={14} />,
  contact_updated: <ContactsIcon size={14} />,
  company_created: <CompaniesIcon size={14} />,
  task_created: <TasksIcon size={14} />,
  task_completed: <CheckIcon size={14} />,
};

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="px-5 py-4 first:pl-0 sm:px-6">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="tnum mt-1.5 text-2xl font-semibold text-slate-900">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    Promise.all([listContacts(), listCompanies(), listTasks(), listActivity(8)])
      .then(([c, co, t, a]) => {
        setContacts(c);
        setCompanies(co.length);
        setTasks(t);
        setActivity(a);
      })
      .catch(() => toast.error("Couldn't load your data. Check your connection."))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Spinner />;

  const today = new Date().toISOString().slice(0, 10);
  const leads = contacts.filter((c) => c.status === "lead").length;
  const customers = contacts.filter((c) => c.status === "customer").length;
  const openTasks = tasks.filter((t) => !t.done);
  const dueToday = openTasks.filter((t) => t.due_date && t.due_date <= today);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header + primary action */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {contacts.length} contacts · {companies} companies
        </p>
        <Link to="/contacts" className="btn-primary">
          <PlusIcon size={16} /> Add contact
        </Link>
      </div>

      {/* Calm metric bar (not hero tiles) */}
      <div className="card flex flex-wrap divide-x divide-slate-100 px-5 py-1 sm:py-2">
        <Metric label="Contacts" value={contacts.length} />
        <Metric label="Open leads" value={leads} hint="status: lead" />
        <Metric label="Customers" value={customers} hint="won business" />
        <Metric
          label="Due today"
          value={dueToday.length}
          hint={`${openTasks.length} open total`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Follow-ups due */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Follow-ups due
            </h2>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all <ArrowRightIcon size={13} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {dueToday.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-400">
                Nothing due today. You're all caught up.
              </p>
            )}
            {dueToday.slice(0, 6).map((t) => {
              const contact = contacts.find((c) => c.id === t.contact_id);
              const overdue = t.due_date! < today;
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${
                      overdue ? "bg-red-400" : "bg-amber-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">
                      {t.title}
                    </div>
                    {contact && (
                      <div className="text-xs text-slate-500">{contact.name}</div>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      overdue ? "text-red-600" : "text-amber-600"
                    }`}
                  >
                    {overdue ? "Overdue" : "Today"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent activity
            </h2>
          </div>
          <div className="px-5 py-2">
            {activity.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                No activity yet.
              </p>
            )}
            <ul className="space-y-3 py-2">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    {ACTIVITY_ICON[a.type] ?? <span className="text-xs">•</span>}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-slate-700">{a.description}</div>
                    <div className="tnum text-xs text-slate-400">
                      {timeAgo(a.created_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
