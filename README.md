# KOBIS Connect — Shared Office CRM

> **Maturity:** Functional prototype · browser demo and optional Supabase shared-office mode

KOBIS Connect is a focused relationship-management workspace for small teams. It organises contacts, companies, follow-ups and activity in a calmer alternative to scattered spreadsheets, personal notes and memory.

**Live demonstration:** [kobis-connect.netlify.app](https://kobis-connect.netlify.app/)

## Business problem

Small organisations often hold valuable client and lead information across spreadsheets, phones and individual staff conversations. This makes ownership unclear and follow-ups easy to miss. KOBIS Connect tests a lightweight shared system for answering three practical questions: who are we speaking with, what is the current relationship, and what must happen next?

## Intended users

- Small-office leadership
- Business-development and sales staff
- Client-service and administrative teams
- Staff importing an existing spreadsheet contact list
- Portfolio reviewers evaluating practical workflow and data-product delivery

## Demonstrated capabilities

- Dashboard with relationship KPIs, upcoming work and activity
- Searchable contact records with status, tags and notes
- Company records linked to contacts
- Follow-up tasks grouped into overdue, today and upcoming work
- Activity logging
- Add, edit and delete workflows
- Excel, XLS and CSV contact import
- Column mapping, automatic field matching and company creation during import
- Keyboard shortcuts and responsive navigation
- Automatic selection between browser demo mode and Supabase shared mode

## Strategic value

The product provides an achievable first CRM layer for teams that are not ready for a complex enterprise platform. Its single data-access interface allows the same user experience to operate against local demonstration storage or a shared Supabase database, providing a clear pathway from validation to controlled internal adoption.

## What is actually implemented

In demo mode, the application stores seeded and user-entered records in browser `localStorage`. Data is limited to that browser profile and is unsuitable as a durable organisational record.

When valid Supabase environment variables are supplied, the application uses Supabase authentication and shared PostgreSQL tables. The supplied schema enables Row Level Security, but its current “team access” policy permits every authenticated account to read and change all CRM tables. This is appropriate only for a trusted prototype team and must be redesigned for least-privilege production roles.

No generative-AI lead scoring, automated outreach, sentiment analysis or autonomous sales decisions are implemented.

## Technology

- React 18, TypeScript and Vite
- React Router
- Tailwind CSS
- SheetJS for spreadsheet import
- Supabase Auth and PostgreSQL
- Dual localStorage/Supabase data adapter
- Netlify deployment configuration

## Delivery role

**Ts. Zaiwin Kassim** leads product framing, small-team workflow requirements, solution direction and supervised AI-assisted delivery with the **KOBIS AI Prodigy Team**. The repository demonstrates practical CRM architecture and implementation; it does not claim customer adoption, sales performance or production certification.

## Responsible-use boundaries

- Contact data may be personal data. Collection, import and use must have a lawful purpose, appropriate notice and consent where required.
- Spreadsheet imports should be reviewed for duplicates, accuracy, source authority and marketing permissions before use.
- Production access must use organisation-specific roles, least privilege, account offboarding, strong authentication and audit logs.
- Email addresses and phone numbers must not be used for unsolicited or unlawful outreach.
- Users need correction, deletion, retention and export processes aligned with applicable privacy obligations, including Malaysia’s PDPA where relevant.
- Backups, recovery testing, encryption, incident response and administrative oversight are required before the CRM becomes a system of record.
- Human staff remain responsible for relationship status, follow-up decisions and communications.

## Current limitations

- Demo-mode data is browser-local and not shared across devices.
- Shared mode has a flat authenticated-team access policy rather than granular roles.
- No deduplication engine, consent register, campaign automation or communication-provider integration is evidenced.
- No attachment store, organisation partitioning or field-level access controls
- No automated test suite, security assessment or production monitoring is evidenced.
- The live URL demonstrates interface availability, not that Supabase shared mode is enabled.

## Run locally

```bash
npm install
npm run dev
npm run build
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only when a correctly governed Supabase project is ready.

## Portfolio evidence

KOBIS Connect demonstrates user-centred CRM design, spreadsheet onboarding, dual-mode data architecture, Supabase integration and responsible handling of the gap between a functional prototype and a governed customer-data system.
