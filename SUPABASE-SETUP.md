# Connecting KOBIS Connect to Supabase

The app is already written for Supabase — `src/lib/supabase.ts` creates
the client, and every data path checks `isSupabaseConfigured` first. With
no credentials it runs in browser demo mode (`localStorage`); with them
it switches to the shared database.

**No code changes are needed.** This is configuration only.

## 1. Create the project

Supabase dashboard → New project. Pick a region close to the office
(Singapore for Malaysia). Save the database password somewhere safe —
it is shown once.

## 2. Create the tables

SQL Editor → New query → paste `supabase/schema.sql` → Run.

It creates four tables — `companies`, `contacts`, `tasks`, `activity` —
with indexes, enables Row Level Security on all of them, and adds a
`team access` policy.

Re-running it is safe: every statement is `if not exists`, and the
policies are dropped and recreated.

## 3. Wire up local development

Settings → API gives you the two values.

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

```bash
npm install
npm run dev
```

The app switches out of demo mode automatically once both are set.
`.env` is gitignored — keep it that way.

## 4. Wire up the deployed site

The same two variables go into Netlify → Site configuration →
Environment variables, then redeploy. Without them the live site stays
in demo mode and every visitor gets their own private browser copy.

## 5. Create accounts

The `team access` policy applies `to authenticated`, so the anon key
alone grants nothing — everyone needs an account. Authentication →
Users → Add user, for each team member.

## A note on the access policy

The shipped policy is:

```sql
create policy "team access" on public.<table>
  for all to authenticated
  using (true) with check (true);
```

Any signed-in account can read and change every row in every table.
That is a deliberate trusted-office model, and the README already says
so — the anon key does not get in, which is the important part.

It becomes wrong the moment the account list stops being "people we
trust with all the data": a client given a login, a contractor, a
departing employee whose account is still active. At that point replace
it with per-user or per-team policies keyed on `auth.uid()` before
adding the account, not after.
