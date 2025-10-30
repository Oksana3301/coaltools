# CoalTools – Comprehensive Project Wiki

Welcome to CoalTools. This repository contains a production-grade, full‑stack payroll and operations toolkit designed for coal/mining businesses. The app focuses on accurate payroll computation, robust data safety, and seamless PDF workflows (export/import), with cloud-ready deployment.

This wiki helps new readers quickly understand the value, features, and how to use, run, and contribute to the project.

## Highlights

- Accurate, auditable payroll calculation with earnings, deductions, tax, and overtime
- PDF export/import for payroll runs (shareable statements and easy re‑ingestion)
- Safe database writes (no destructive overwrite of historical data)
- Supabase/Postgres production-ready, SQLite for fast local dev
- Modern Next.js App Router (React + TypeScript), Tailwind, shadcn/ui
- Prisma ORM with clear models for Users, Employees, Payroll, Kas Kecil/Besar, Kwitansi, Invoices
- Deployed to Vercel; works with Supabase as managed Postgres

## Table of Contents

1. Vision & Audience
2. System Architecture
3. Tech Stack
4. Core Features
5. Domain Models Overview
6. Getting Started (Local)
7. Environment Variables
8. Database Setup (SQLite → Supabase)
9. Development Workflow
10. Security & Data Safety
11. PDF Export/Import (Payroll)
12. API Overview
13. Deployment (Vercel + Supabase)
14. Troubleshooting
15. Roadmap
16. Contributing
17. License

---

## 1) Vision & Audience

CoalTools helps operational teams and administrators in coal/mining companies streamline payroll and related back‑office processes. It aims to be:

- Trustworthy: precise calculations, transaction safety, and clear auditability
- Practical: export/import documents as PDFs, store data reliably
- Cloud‑ready: deploy to Vercel, plug into Supabase or another Postgres

## 2) System Architecture

- Frontend: Next.js App Router (React/TypeScript), shadcn/ui, Tailwind CSS
- Backend: Next.js API Routes (server components), Prisma ORM
- Storage: SQLite (local dev), Postgres (Supabase) in production
- Auth: Custom endpoints with robust validation and logging
- PDF: Client‑driven generation/import for payroll statements

## 3) Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM
- SQLite (dev), Supabase/Postgres (prod)
- Vercel (hosting)

## 4) Core Features

- Integrated Payroll System (earnings, deductions, tax, overtime)
- PDF Export & Import for payroll data
- Safe Save‑to‑Database (non‑destructive writes, transactional)
- Cash modules: Kas Kecil and Kas Besar (CRUD, stats)
- Invoices & Kwitansi (receipts)
- Admin test/diagnostics pages

## 5) Domain Models Overview (Selected)

- User, LoginActivity
- Employee
- PayComponent (EARNING/DEDUCTION)
- PayrollRun, PayrollLine, PayrollLineComponent
- EmployeeComponentSelection
- KasKecilExpense, KasBesarTransaction
- Invoice, Kwitansi

See `prisma/schema.prisma` for the full schema.

## 6) Getting Started (Local)

Prerequisites:
- Node.js 18+
- npm 9+

Steps:
1. Clone the repo
2. Copy env template and configure development values
   - `cp env.supabase.template .env.local`
   - Ensure `DATABASE_URL="file:./dev.db"`
3. Install dependencies
   - `npm install`
4. Generate Prisma client and push schema
   - `npx prisma generate`
   - `npx prisma db push`
5. Start the dev server
   - `npm run dev`
6. Open `http://localhost:3000`

## 7) Environment Variables

Local (example):
- `DATABASE_URL=file:./dev.db` (SQLite)
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- Optional Supabase vars for later cloud run/testing

Production (example):
- `DATABASE_URL` (Postgres from Supabase)
- Other secrets as needed (see `.env` usage across `app/api/*`)

## 8) Database Setup (SQLite → Supabase)

- Local dev uses SQLite for speed and simplicity (`file:./dev.db`).
- Production uses Supabase (managed Postgres). Update `DATABASE_URL` accordingly.
- Prisma migrations/`db push` keep schema in sync.

## 9) Development Workflow

- UI/Logic changes in `components/` and `app/(with-sidebar)/*`
- API endpoints in `app/api/*/route.ts`
- ORM types and relations: `prisma/schema.prisma`
- Hooks/utilities in `hooks/` and `lib/`

Recommended:
- Add/modify Prisma models → `npx prisma generate` + `npx prisma db push`
- Keep feature PRs small and focused

## 10) Security & Data Safety

- Non‑destructive saves for payroll runs (no overwriting historical data)
- Prisma transactions for multi‑table writes
- Input validation via zod (where applicable)
- Auth endpoints include defensive checks and logging

## 11) PDF Export/Import (Payroll)

- Export payroll runs to PDF for sharing/archiving
- Import back from PDF to prefill or reconstruct payroll data
- UI entry point: `components/payroll/IntegratedPayrollSystem.tsx` (PDF Tools tab)
- Backed by dedicated components:
  - `components/payroll/PayrollPDFExport.tsx`
  - `components/payroll/PayrollPDFImport.tsx`
  - `components/payroll/PayrollSaveToDatabase.tsx`

## 12) API Overview (Selected)

- `POST /api/payroll` – create payroll run + lines
- `GET /api/payroll` – list payroll runs (with pagination)
- `GET /api/payroll/[id]` – get a full run with lines
- `POST /api/payroll/save` – save current computed payroll
- `GET/POST /api/kas-kecil` – petty cash
- `GET/POST /api/kas-besar` – general cash
- `GET /api/kas-besar/stats` – cash stats
- `POST /api/invoices` – create invoices
- `POST /api/kwitansi` – create receipts

Explore `app/api/*/route.ts` for details and payloads.

## 13) Deployment (Vercel + Supabase)

1. Provision a Supabase project (Postgres URL/credentials)
2. Set Vercel environment variables (`DATABASE_URL`, secrets)
3. Deploy via Vercel CLI or GitHub integration
4. Verify health endpoints and basic CRUD

Tips:
- Ensure Prisma client imports and Node versions match Vercel runtime
- Use production Postgres connection pooling if needed (e.g., Accelerate/pgBouncer)

## 14) Troubleshooting

- Prisma schema errors → check `DATABASE_URL` format
- Missing models/fields → re‑generate Prisma client and ensure schema accuracy
- Vercel build errors → inspect logs, resolve type/syntax issues in API routes
- PDF issues → confirm browser permissions and file types

## 15) Roadmap

- Richer payroll component rules and presets
- Role‑based access control refinements
- More financial reporting and dashboards
- End‑to‑end tests and seed data packs

## 16) Contributing

Contributions are welcome! Please:
1. Open an issue describing the change/bug
2. Fork and create a feature branch
3. Submit a PR with a clear description and testing notes

## 17) License

This project is provided under a permissive license. See `LICENSE` (or add one if missing).

---

If you have questions or suggestions, please open an issue. Thanks for visiting the CoalTools repository!


