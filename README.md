# Office CRM

A simple, clean CRM for a small team — **contacts & companies**, **tasks /
follow-ups**, and a **dashboard** with KPIs and an activity feed.

Built with **React + Vite + TypeScript + Tailwind**, with **Supabase** for the
shared database and login.

---

## Two ways to run it

| Mode | When | Data |
|------|------|------|
| **Demo mode** | No setup — just `npm run dev` | Saved in your browser (localStorage). Single machine, no login. |
| **Shared office mode** | Add Supabase keys | One live database everyone shares, with email/password login. |

The app auto-detects which mode it's in: if the two Supabase env vars are set,
it's shared mode; otherwise it's demo mode. Same code, no rewrite.

---

## Run locally

```bash
npm install
npm run dev        # open the printed http://localhost:5173
```

That's it for demo mode — it opens with a little sample data so you can click
around immediately.

---

## Turn on shared office mode

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Create the tables:** open your project → **SQL Editor** → **New query** →
   paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. **Get your keys:** project **Settings → API**. Copy the *Project URL* and the
   *anon public* key.
4. **Add them locally:**
   ```bash
   cp .env.example .env
   # then edit .env:
   # VITE_SUPABASE_URL=https://xxxx.supabase.co
   # VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
5. Restart `npm run dev`. You'll now get a login screen. Create an account
   (Supabase → Authentication) and your whole team shares the same data.

> Tip: In Supabase → **Authentication → Providers → Email**, turn *"Confirm
> email"* off while getting started so new teammates can log in instantly.

---

## Deploy to Netlify

The repo already includes [`netlify.toml`](netlify.toml).

1. Push this repo to GitHub (already done if you're reading this there).
2. In Netlify: **Add new site → Import from Git** → pick this repo.
3. Build settings are auto-detected (`npm run build`, publish `dist`).
4. Add the two environment variables (**Site settings → Environment variables**):
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy. Share the URL with the office.

---

## Project layout

```
src/
  lib/
    types.ts       shared TypeScript types
    supabase.ts    Supabase client (null in demo mode)
    db.ts          data layer — one API, two backends (Supabase / localStorage)
  context/
    AuthContext.tsx   login state (bypassed in demo mode)
  components/
    Layout.tsx     sidebar + top bar shell
    ui.tsx         Modal, Field, Badge, EmptyState, Avatar, Spinner…
  pages/
    Dashboard.tsx  KPIs, follow-ups due, activity feed
    Contacts.tsx   searchable table + add/edit
    Companies.tsx  company cards + add/edit
    Tasks.tsx      grouped follow-ups (overdue / today / upcoming)
    Login.tsx      email + password (shared mode only)
supabase/
  schema.sql       run once in the Supabase SQL editor
```

## Scripts

```bash
npm run dev       # local dev server
npm run build     # typecheck + production build to dist/
npm run preview   # preview the production build
```
