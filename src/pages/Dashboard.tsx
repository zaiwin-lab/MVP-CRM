import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listActivity,
  listContacts,
  listCompanies,
  listTasks,
} from "../lib/db";
import type { Activity, Contact, Task } from "../lib/types";
import { Spinner } from "../components/ui";

const ACTIVITY_ICON: Record<string, string> = {
  contact_created: "☺",
  contact_updated: "✎",
  company_created: "▤",
  task_created: "✓",
  task_completed: "✔",
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
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
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    Promise.all([
      listContacts(),
      listCompanies(),
      listTasks(),
      listActivity(8),
    ]).then(([c, co, t, a]) => {
      setContacts(c);
      setCompanies(co.length);
      setTasks(t);
      setActivity(a);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const today = new Date().toISOString().slice(0, 10);
  const leads = contacts.filter((c) => c.status === "lead").length;
  const customers = contacts.filter((c) => c.status === "customer").length;
  const openTasks = tasks.filter((t) => !t.done);
  const dueToday = openTasks.filter((t) => t.due_date && t.due_date <= today);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total contacts" value={contacts.length} />
        <StatCard label="Open leads" value={leads} hint="Status: lead" />
        <StatCard label="Customers" value={customers} hint="Won business" />
        <StatCard
          label="Tasks due"
          value={dueToday.length}
          hint={`${openTasks.length} open total`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's follow-ups */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Follow-ups due
            </h2>
            <Link
              to="/tasks"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {dueToday.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                🎉 Nothing due today. You're all caught up.
              </p>
            )}
            {dueToday.slice(0, 6).map((t) => {
              const contact = contacts.find((c) => c.id === t.contact_id);
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">
                      {t.title}
                    </div>
                    {contact && (
                      <div className="text-xs text-slate-500">
                        {contact.name}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {t.due_date === today ? "Today" : "Overdue"}
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
              <p className="py-6 text-center text-sm text-slate-400">
                No activity yet.
              </p>
            )}
            <ul className="space-y-3 py-2">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                    {ACTIVITY_ICON[a.type] ?? "•"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-slate-700">{a.description}</div>
                    <div className="text-xs text-slate-400">
                      {timeAgo(a.created_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-5 text-white shadow-card">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-semibold">
              {companies} companies · {contacts.length} contacts on file
            </div>
            <div className="text-sm text-brand-100">
              Add a new contact or log a follow-up to keep things moving.
            </div>
          </div>
          <Link
            to="/contacts"
            className="btn bg-white font-semibold text-brand-700 hover:bg-brand-50"
          >
            + Add contact
          </Link>
        </div>
      </div>
    </div>
  );
}
