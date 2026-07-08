export type ContactStatus = "lead" | "active" | "customer" | "inactive";

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  status: ContactStatus;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  contact_id: string | null;
  due_date: string | null; // ISO date (yyyy-mm-dd)
  done: boolean;
  created_at: string;
}

export type ActivityType =
  | "contact_created"
  | "contact_updated"
  | "company_created"
  | "task_created"
  | "task_completed";

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  created_at: string;
}

export const STATUS_LABELS: Record<ContactStatus, string> = {
  lead: "Lead",
  active: "Active",
  customer: "Customer",
  inactive: "Inactive",
};

export const STATUS_STYLES: Record<ContactStatus, string> = {
  lead: "bg-amber-100 text-amber-800 ring-amber-200",
  active: "bg-blue-100 text-blue-800 ring-blue-200",
  customer: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
};
