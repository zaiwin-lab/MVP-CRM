-- =====================================================================
--  KOBIS Connect — Supabase schema
--  Run this once in your Supabase project:  SQL Editor -> New query -> Run
-- =====================================================================

-- Companies -----------------------------------------------------------
create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  website    text,
  industry   text,
  notes      text,
  created_at timestamptz not null default now()
);

-- Contacts ------------------------------------------------------------
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  company_id uuid references public.companies (id) on delete set null,
  status     text not null default 'lead'
             check (status in ('lead','active','customer','inactive')),
  tags       text[] not null default '{}',
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_company_idx on public.contacts (company_id);
create index if not exists contacts_status_idx  on public.contacts (status);

-- Tasks / follow-ups --------------------------------------------------
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  contact_id uuid references public.contacts (id) on delete cascade,
  due_date   date,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tasks_due_idx on public.tasks (due_date);

-- Activity log --------------------------------------------------------
create table if not exists public.activity (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  description text not null,
  created_at  timestamptz not null default now()
);
create index if not exists activity_created_idx on public.activity (created_at desc);

-- =====================================================================
--  Row Level Security
--  Any signed-in team member has full access. (The office is trusted;
--  authentication is the gate. Tighten later if you need per-user rules.)
-- =====================================================================
alter table public.companies enable row level security;
alter table public.contacts  enable row level security;
alter table public.tasks     enable row level security;
alter table public.activity  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['companies','contacts','tasks','activity']
  loop
    execute format(
      'drop policy if exists "team access" on public.%I;', t);
    execute format(
      'create policy "team access" on public.%I
         for all to authenticated
         using (true) with check (true);', t);
  end loop;
end $$;
