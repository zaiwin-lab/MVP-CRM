import { supabase, isSupabaseConfigured } from "./supabase";
import type { Activity, ActivityType, Company, Contact, Task } from "./types";

/**
 * Single data-access layer for the whole app.
 *
 * It has two interchangeable backends behind one identical API:
 *   - Supabase  (shared office mode)  when env vars are set
 *   - localStorage (local demo mode)  otherwise
 *
 * Components never touch a backend directly — they only call these functions,
 * so switching from demo to shared mode is just adding two env vars.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = () => new Date().toISOString();
const uid = () =>
  (crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`);

// ---------------------------------------------------------------------------
// Local (demo) backend — persists to localStorage
// ---------------------------------------------------------------------------

const KEY = "office-crm:v1";

interface LocalDb {
  companies: Company[];
  contacts: Contact[];
  tasks: Task[];
  activity: Activity[];
}

function readLocal(): LocalDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LocalDb;
  } catch {
    /* ignore corrupt storage */
  }
  const seeded = seed();
  writeLocal(seeded);
  return seeded;
}

function writeLocal(db: LocalDb) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

/** A little sample data so the demo doesn't open on an empty void. */
function seed(): LocalDb {
  const t = now();
  const acme: Company = {
    id: uid(),
    name: "Acme Studios",
    website: "acme.example",
    industry: "Design",
    notes: null,
    created_at: t,
  };
  const contact: Contact = {
    id: uid(),
    name: "Jordan Reyes",
    email: "jordan@acme.example",
    phone: "+1 555 0142",
    company_id: acme.id,
    status: "lead",
    tags: ["website", "priority"],
    notes: "Interested in a brand refresh. Follow up after the proposal.",
    created_at: t,
    updated_at: t,
  };
  const task: Task = {
    id: uid(),
    title: "Send proposal to Jordan",
    contact_id: contact.id,
    due_date: new Date().toISOString().slice(0, 10),
    done: false,
    created_at: t,
  };
  return {
    companies: [acme],
    contacts: [contact],
    tasks: [task],
    activity: [
      {
        id: uid(),
        type: "contact_created",
        description: "Added Jordan Reyes",
        created_at: t,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export async function listCompanies(): Promise<Company[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!
      .from("companies")
      .select("*")
      .order("name");
    if (error) throw error;
    return data as Company[];
  }
  return readLocal().companies.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCompany(
  input: Pick<Company, "name" | "website" | "industry" | "notes">
): Promise<Company> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!
      .from("companies")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    await logActivity("company_created", `Added ${input.name}`);
    return data as Company;
  }
  const db = readLocal();
  const company: Company = { id: uid(), created_at: now(), ...input };
  db.companies.push(company);
  pushLocalActivity(db, "company_created", `Added ${input.name}`);
  writeLocal(db);
  return company;
}

export async function updateCompany(
  id: string,
  input: Partial<Pick<Company, "name" | "website" | "industry" | "notes">>
): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from("companies").update(input).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readLocal();
  db.companies = db.companies.map((c) => (c.id === id ? { ...c, ...input } : c));
  writeLocal(db);
}

export async function deleteCompany(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from("companies").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readLocal();
  db.companies = db.companies.filter((c) => c.id !== id);
  // Unlink contacts that pointed at this company.
  db.contacts = db.contacts.map((c) =>
    c.company_id === id ? { ...c, company_id: null } : c
  );
  writeLocal(db);
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export async function listContacts(): Promise<Contact[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Contact[];
  }
  return readLocal().contacts.sort(
    (a, b) => b.created_at.localeCompare(a.created_at)
  );
}

export type ContactInput = Pick<
  Contact,
  "name" | "email" | "phone" | "company_id" | "status" | "tags" | "notes"
>;

export async function createContact(input: ContactInput): Promise<Contact> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!
      .from("contacts")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    await logActivity("contact_created", `Added ${input.name}`);
    return data as Contact;
  }
  const db = readLocal();
  const contact: Contact = {
    id: uid(),
    created_at: now(),
    updated_at: now(),
    ...input,
  };
  db.contacts.push(contact);
  pushLocalActivity(db, "contact_created", `Added ${input.name}`);
  writeLocal(db);
  return contact;
}

export async function updateContact(
  id: string,
  input: Partial<ContactInput>
): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!
      .from("contacts")
      .update({ ...input, updated_at: now() })
      .eq("id", id);
    if (error) throw error;
    await logActivity("contact_updated", `Updated ${input.name ?? "a contact"}`);
    return;
  }
  const db = readLocal();
  const existing = db.contacts.find((c) => c.id === id);
  db.contacts = db.contacts.map((c) =>
    c.id === id ? { ...c, ...input, updated_at: now() } : c
  );
  pushLocalActivity(
    db,
    "contact_updated",
    `Updated ${input.name ?? existing?.name ?? "a contact"}`
  );
  writeLocal(db);
}

export async function deleteContact(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from("contacts").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readLocal();
  db.contacts = db.contacts.filter((c) => c.id !== id);
  db.tasks = db.tasks.filter((t) => t.contact_id !== id);
  writeLocal(db);
}

/**
 * Ensure a company exists for each name (case-insensitive). Creates the
 * missing ones and returns a lowercased-name -> id map for linking contacts.
 * Used by the spreadsheet importer.
 */
export async function ensureCompaniesByName(
  names: string[]
): Promise<Record<string, string>> {
  const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const existing = await listCompanies();
  const map: Record<string, string> = {};
  for (const c of existing) map[c.name.toLowerCase()] = c.id;

  const missing = wanted.filter((n) => !(n.toLowerCase() in map));
  for (const name of missing) {
    const company = await createCompany({
      name,
      website: null,
      industry: null,
      notes: null,
    });
    map[name.toLowerCase()] = company.id;
  }
  return map;
}

/** Insert many contacts at once (spreadsheet import). Returns the created rows. */
export async function bulkCreateContacts(
  inputs: ContactInput[]
): Promise<Contact[]> {
  if (!inputs.length) return [];
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!
      .from("contacts")
      .insert(inputs)
      .select();
    if (error) throw error;
    await logActivity(
      "contact_created",
      `Imported ${inputs.length} contact${inputs.length === 1 ? "" : "s"}`
    );
    return data as Contact[];
  }
  const db = readLocal();
  const created: Contact[] = inputs.map((input) => ({
    id: uid(),
    created_at: now(),
    updated_at: now(),
    ...input,
  }));
  db.contacts.push(...created);
  pushLocalActivity(
    db,
    "contact_created",
    `Imported ${inputs.length} contact${inputs.length === 1 ? "" : "s"}`
  );
  writeLocal(db);
  return created;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function listTasks(): Promise<Task[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data as Task[];
  }
  return readLocal().tasks.sort((a, b) =>
    (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")
  );
}

export async function createTask(
  input: Pick<Task, "title" | "contact_id" | "due_date">
): Promise<Task> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!
      .from("tasks")
      .insert({ ...input, done: false })
      .select()
      .single();
    if (error) throw error;
    await logActivity("task_created", `New task: ${input.title}`);
    return data as Task;
  }
  const db = readLocal();
  const task: Task = { id: uid(), done: false, created_at: now(), ...input };
  db.tasks.push(task);
  pushLocalActivity(db, "task_created", `New task: ${input.title}`);
  writeLocal(db);
  return task;
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from("tasks").update({ done }).eq("id", id);
    if (error) throw error;
    if (done) {
      const { data } = await supabase!
        .from("tasks")
        .select("title")
        .eq("id", id)
        .single();
      if (data) await logActivity("task_completed", `Completed: ${data.title}`);
    }
    return;
  }
  const db = readLocal();
  const task = db.tasks.find((t) => t.id === id);
  db.tasks = db.tasks.map((t) => (t.id === id ? { ...t, done } : t));
  if (done && task) pushLocalActivity(db, "task_completed", `Completed: ${task.title}`);
  writeLocal(db);
}

export async function deleteTask(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from("tasks").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readLocal();
  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeLocal(db);
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export async function listActivity(limit = 12): Promise<Activity[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Activity[];
  }
  return readLocal()
    .activity.sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

async function logActivity(type: ActivityType, description: string) {
  if (!isSupabaseConfigured) return;
  await supabase!.from("activity").insert({ type, description });
}

function pushLocalActivity(db: LocalDb, type: ActivityType, description: string) {
  db.activity.unshift({ id: uid(), type, description, created_at: now() });
  db.activity = db.activity.slice(0, 100);
}
