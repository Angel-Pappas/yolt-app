# Stack Change Plan

Authoritative planning document for migrating **Yolt-App** from its current stack
(Next.js + Supabase, hosted on Vercel) to the company's stack (**Laravel 13 + the
official React starter kit**). It records every decision and detail agreed so far.

Keep it current, and **verify every technical fact in it against live/official
sources before relying on it** — this document is NOT exempt from that rule
(Direction 6). Each fact below is tagged **[verified 2026-08-28]**,
**[unverified — confirm at build]**, or **[DECISION NEEDED]**.

_Started: 2026-08-28. Revised: 2026-08-28 after a critical review that found ~20
gaps in the first draft (broken FKs on user migration, an infeasible
"parallel-run", schema-vs-Laravel-convention conflicts, missing views, an
overstated "100% in PHP", unverified claims, and missing prerequisites). This
revision resolves them. Status: **planning only — no build work started.**_

---

## 1. Why we are doing this (the driver)

Strategic/organizational, **not** technical dissatisfaction — the current app
works well and was just audited clean.

- The app is growing: the **Business/CRM** part means **other people in the
  company will start using it** (mostly for information; the owner is the main
  power-user).
- The company works in **PHP/Laravel**; the team objects to the different stack
  and has floated building their own app instead.
- Owner's goals, in order: (1) remove the "wrong stack" objection by moving to the
  company's stack; (2) position the app to be incorporated into company infra
  later; (3) **keep control** of the app's expansion and roadmap.
- **[DECIDED 2026-08-28] Political gate.** Once the app is on company
  infrastructure, "control" is partly *organizational*, not technical. **The owner
  will lock down a roadmap-ownership understanding before the rewrite is handed
  over.**

---

## 2. Target stack

**[verified 2026-08-28]** unless noted. Re-verify at scaffold time — versions move.

- **Laravel 13** — current major (13.10.0, 2026-08-17; released ~March 2026).
  Minimum **PHP 8.3**.
- **Official React starter kit** — `laravel new <app> --starter-kit=react`.
  Stack: **React 19, TypeScript, Inertia 3, Tailwind CSS, shadcn/ui, Vite**. Ships
  auth flows, a dashboard, and profile/password settings pages under
  `resources/js/pages/`.
- **Auth backend: Laravel Fortify** (what the starter kit uses for
  login/registration/password-reset/email-verification). A **WorkOS AuthKit**
  variant also exists (social login via an external SaaS) — **we will NOT use
  WorkOS**; it's contrary to the "own it / move onto company infra" goal. Use the
  default Fortify-based auth. **[DECISION NEEDED — confirm]** but strongly
  recommended.
- Sources: laravel.com/docs/13.x/releases, /13.x/starter-kits, /13.x/fortify;
  github.com/laravel/react-starter-kit.

Corrections the first-draft memory got wrong (why Direction 6 exists): latest
Laravel is **13** (not 12); the kit is on **Inertia 3** (not 2).

---

## 3. Architectural model (Inertia)

- **No separate API.** A Laravel controller queries the DB (Eloquent/PHP) and
  passes data as **props** to a React page component. Form submits go to Laravel
  routes (Inertia `useForm`), which run the **authoritative** logic in PHP and
  redirect back with fresh data.
- **The *authoritative* data access and business logic live in PHP.** (Corrected
  from the first draft's "100% of logic in PHP" — that was wrong. Necessary
  **client-side logic stays in React**; see §11.)
- Concept mapping (today → Laravel/Inertia):
  - Server Components → controllers feeding props.
  - Server Actions → Laravel routes + Inertia forms.
  - `revalidatePath` → Inertia's prop refresh / redirects.
  - App Router + route groups + `layout.tsx` → Laravel routes + persistent Inertia
    layouts.
  - `proxy.ts` middleware → Laravel middleware.
  - Supabase JS calls → Eloquent/DB in PHP (the Supabase client leaves the
    frontend entirely).

---

## 4. Approach — a full, from-scratch rewrite (NOT a port)

Explicit owner direction, and the guiding rule:

- **The current app is a reference/specification, not a source to copy.** Look at
  it to learn *what* to build; build each piece fresh and idiomatic in
  Laravel + Inertia + React.
- **No file ports, no copy-paste.** Nothing Next.js-shaped survives. Recreating
  the same look means writing **new Tailwind** to match (natural — the kit is
  already React 19 + TS + Tailwind).
- **Guard against the "patch it together" loop:** build each feature idiomatically
  *first*, then compare to the reference for parity — never start from pasted code
  and patch until it works.

---

## 5. Data & schema strategy

Goal: **keep all business data** and stay as idiomatic as possible.

**[DECIDED 2026-08-28] Target database engine: MySQL 8.4** — the company
standardizes on MySQL (owner ~90% sure; DB is empty so still reversible — worth a
final confirm), so we build on **MySQL**, not Postgres. This means the schema is
**rebuilt for MySQL** and the existing **Postgres (Supabase) data is migrated /
converted into MySQL** at cutover — not kept in place. That conversion is
**low-risk for this data**: money is `numeric`→`DECIMAL` (exact both sides, no
rounding), text preserved via **utf8mb4**, UUIDs → `CHAR(36)`, booleans →
`TINYINT(1)` (all handled by Laravel); the data is tiny; it's a **validated
export/import** (not a blind dump) with the **source Postgres kept intact as
fallback**; and the **parity tests re-verify every number**. See §7. _(Any
Postgres-only mechanics below — partial indexes, sequences, RLS — get a MySQL
equivalent or are already being dropped.)_

Concrete schema decisions (these fix the first draft's "keep the schema exactly" ⇄
"idiomatic Laravel" contradiction):

- **Primary keys — keep the existing UUIDs.** Every table uses UUID PKs and every
  business row's `user_id` references a user UUID. Laravel supports this via the
  **`HasUuids`** trait + `$table->uuid('id')->primary()` **[verified 2026-08-28]**.
  We reuse the **existing** UUIDs (including user IDs), so **no foreign key breaks**
  during migration. _(This was the biggest hole in the first draft.)_
- **Users — merge `auth.users` + `profiles` into one Laravel `users` table**,
  seeded with the **existing user UUIDs** and carrying the permission fields
  (`is_admin`, `can_access_finance`, `can_access_crm`, `is_active`, `full_name`,
  `email`). Passwords copy over: Supabase stores **bcrypt** (`$2a$…`), Laravel
  verifies bcrypt, so **users keep their passwords, no reset** **[verified
  2026-08-28]**. After migration the Supabase `auth.*` schema and `profiles` are
  dropped.
- **Soft deletes — use Laravel's native `SoftDeletes` keyed on `deleted_at`.** The
  existing data already sets `deleted_at` on deleted rows and leaves it null on
  active rows, so Laravel's `deleted_at IS NULL` filter maps onto the current data
  directly. The redundant `is_deleted` boolean is dropped (or ignored). **[confirm
  the data invariant holds for every table before relying on it.]**
- **Timestamps — [unverified — confirm].** The current tables have `created_at`;
  it's unconfirmed whether they have `updated_at`, which Eloquent writes by
  default. Plan: add an `updated_at` column where missing (additive, safe) or
  configure the model. Confirm per table.
- **The Postgres views** `transactions_expanded` and `wallet_balances` (workarounds
  for PostgREST's limits) are **replaced by Eloquent**, not carried over —
  ordering by joined columns is native in Eloquent, and the running/computed
  balances become PHP or SQL aggregates (as the current balance-view already does
  in JS). **[DECISION NEEDED — confirm]**: replace-with-Eloquent (recommended) vs
  keep-as-DB-views.
- **Everything else stays**: transactions, transaction_vat_lines,
  transaction_withheld_lines, entities, wallets, vat_rates, withheld_tax_rates,
  categories, leads, lead_statuses/origins/contacts/actions, projects,
  project_statuses/actions, plus the sort_order sequences.

---

## 6. Security model — RLS → application-layer authorization (its own concern)

The single **biggest correctness/security risk** of the migration, called out
explicitly (the first draft gave it two sentences).

- Today, **all** access control is enforced in the database by RLS
  (`has_finance_access()`, `has_crm_access()`, `is_admin()`, per-row `user_id`
  gates). Your own docs treat "RLS is the real lock" as sacred.
- Laravel's idiom moves this **into the application**: middleware for area access
  (finance/CRM/admin), **Policies/Gates** for per-action authorization, and
  **global query scopes** so a model can never be queried unscoped by accident.
- **This is where a bug leaks another user's data**, so the mitigations are
  first-class:
  - Enforce access in **one place per concern** (middleware + a base scoped query),
    not sprinkled per controller.
  - **Tests that *attempt* forbidden access and assert denial** (a finance-only
    user hitting CRM; user A editing user B's row; a deactivated user; a non-admin
    reassigning an action's author). These are required, not optional.
- **[DECISION NEEDED — default: no]** Optionally keep Postgres RLS as
  defense-in-depth. It fights Laravel's pooled single-DB-role connection model, so
  default is app-layer only + tests. Revisit only if we want belt-and-suspenders.

---

## 7. Migration & cutover mechanism (fixes the "parallel-run" contradiction)

The first draft's "parallel-run both apps against the shared data" is **not
feasible** — two apps with different auth systems and security models cannot both
write one live DB safely. Corrected plan:

1. **Develop against the new MySQL database** (Laravel Cloud). During the build,
   seed it with representative data; the real Postgres data is converted in at
   cutover (step 3). The old app keeps running normally on its own Postgres DB.
2. **Validate** the new app in staging (feature by feature, tests + owner
   walkthrough).
3. **One-time cutover** when ready: freeze writes on the old app briefly, take a
   final export of the Postgres data, **convert it into the new MySQL schema**
   (validated per-table export/import — e.g. `pgloader` into the clean schema, with
   row-count + value checks and the parity tests as the safety net), including the
   users merge (drop the Supabase auth artifacts), point traffic at the new app.
   **No simultaneous dual-writes.**
4. **Fallback/rollback:** keep the old app + its DB intact and runnable for an
   agreed window after cutover, so we can switch back if a blocker appears. Define
   that window before cutover.

---

## 8. Build sequence

1. **Set up the local toolchain** (see §9) — PHP 8.3+, Composer, the Laravel
   installer, Node/Vite. (This machine did not have these; it's a real first step.)
2. **Scaffold** `laravel new <app> --starter-kit=react` (Laravel 13; re-verify).
   Decide the **repo** (§9) first.
3. Stand up the project's own docs (§10) — its `AGENTS.md`/`Summary.md`/`Directions`
   equivalents; the current ones are Next/Vercel/Supabase-specific and don't carry
   over verbatim.
4. Connect to a **copy** of the Postgres schema; write Eloquent models/migrations
   to match (UUID PKs, SoftDeletes, timestamps per §5).
5. **Auth + permission model first** — Fortify auth, the merged `users` table,
   middleware + Policies + global scopes (§6), invites, set-password. With the
   denial-tests from §6.
6. **Finance area** (Transactions is the core; owner is main user), feature by
   feature — **each with tests**, each checked for **parity** (§13).
7. Then **CRM** (Leads, Projects), then **Settings**, then the **Excel import**.
8. Build to look/work/feel the same; the **real data cutover is last** (§7).

---

## 9. Repo, environment & prerequisites (new — these were missing)

- **[DECIDED 2026-08-28] Separate new repo.** The Laravel app lives in its own repo,
  **`Angel-Pappas/yolt-app-new`** (already created, currently empty). Not this repo
  — this one is wired to Vercel and auto-deploys on push to `main`. **[flag]** the
  new repo is currently **public**; recommend switching it to **private** before
  pushing the app (company financial/CRM code). Direction 2 (auto-deploy on push)
  does **not** apply to the new repo — see hosting (§17).
- **Local toolchain** to install first: PHP 8.3+, Composer, the `laravel`
  installer, Node.js (already present) for Vite. Confirm each is installed and on
  PATH before scaffolding.
- **Mail/SMTP** — invites and password resets need a real mail transport. The
  current app leaned on Supabase's (rate-limited) built-in email; Laravel needs
  **SMTP credentials** configured (`.env`). This is a prerequisite, not an
  afterthought. **[DECISION NEEDED]**: which SMTP provider.
- **Environment/secrets** — `.env` for DB connection, `APP_KEY`, mail, etc. Not
  committed. Decide where production secrets live (host's dashboard, as today).

---

## 10. Working discipline (verify & document)

- **Always assume memory is wrong and verify** — never state a version/API/"right
  way" from memory; look it up against official/current sources first. Any such
  claim made without a lookup is a bug (Direction 6).
- **Document what's verified** — the new repo gets its own engineering log
  (name/location TBD in that repo; the equivalent of this app's `Summary.md`) with
  verified facts, decisions, and source links; keep it current; consult it first,
  re-search when it's silent.
- Mirrors the existing `AGENTS.md` instinct ("This is NOT the Next.js you know —
  read the guide first"). The Laravel project needs the same posture.

---

## 11. Client-side logic to rebuild in React (new — corrects the §3 overstatement)

These are genuinely client-side and do **not** move to PHP. They're rebuilt fresh
in React and are their own parity targets:

- Live **VAT / withholding / Total preview** as the user types (a *duplicate* of
  the authoritative PHP calc — acceptable, exactly as the current app duplicates it
  between client preview and server).
- The locale-independent **segmented dd/mm/yyyy date field** (keyboard behaviour,
  clamping, ISO emit).
- **Amount inputs** — comma/dot tolerant sanitization (`,` decimal, `.` thousands).
- **Inline edits** (Next step / Status), **top-layer filter popovers**,
  **comboboxes**, **tri-state sort**, **load-as-you-scroll**, the segmented
  controls, theme switching.

(Client-side validation is for UX; the **server** re-validates authoritatively.)

---

## 12. Business logic to re-implement in PHP (each with tests)

Server-side/authoritative only (client-side items live in §11). Verified against
the current app's behaviour, encoded as tests:

- VAT lines — multi-rate, one Net/Total mode per transaction; Total-mode
  `vat_amount` anchored to `total − net` (avoids double-rounding).
- Withholding-tax lines (parallel to VAT lines; always on net; optional).
- `computeTotal = net + vat_amount − withheld_amount`.
- **Greek VAT monthly ledger** — chronological walk, credit rollover, installments
  (debit > €100 → two equal interest-free parts; ≤ €100 paid in full), gap-month
  walking; installment option always taken.
- **Withholding remittance ledger** — collected this month → payable next month,
  by **payment date**.
- **Running wallet balances** — `starting_balance` + each active transaction's
  signed effect.
- Invoice-month **1–13** resolution (13 = "no invoice needed").
- **Invoice-date** VAT-period attribution.
- **Excel import** — the fixed spreadsheet format, the 1–13 "Bacon" column, wallet
  aliases, auto-creating missing entities/categories/wallets, chunked writes,
  per-row failure reporting, upload-size handling. **[unverified — confirm]** the
  library: likely `maatwebsite/excel` or `PhpSpreadsheet`; confirm Laravel-13
  compatibility and pick at build time.
- **Soft-delete** everywhere (no hard delete in the app).
- **[DECIDED 2026-08-28]** Some Greek tax rules the current app implements are
  documented as "researched, not accountant-confirmed." **The owner will verify the
  Greek tax rules** while we rebuild them; parity otherwise means matching the
  current app.

---

## 13. Definition of "parity" / acceptance (new — was undefined)

"Looks/works/feels the same" needs teeth. A feature is **done** when:

1. Its **tests pass** (unit for logic, feature for flows + authorization denial).
2. Its **behaviour matches** the current app on a shared checklist of cases
   (including the documented edge cases — rounding, installments, soft-delete
   visibility, permission gating).
3. The **owner signs off** on look/feel from a walkthrough (the subjective part
   stays a human check, per Direction 3).

Numbers (tax, balances, VAT) are verified by **assertion against known-correct
values**, not by eyeballing.

---

## 14. Feature inventory to reproduce (parity checklist)

Build and verify one at a time — not a license to port. (Full behavioural spec:
the current app's `Summary.md`.)

- **Auth** — login, password reset, **invite flow + set-password** (public signup
  is **closed/invite-only**; there is no self-service email-verification feature to
  reproduce — corrected from the first draft).
- **Multi-user, areas & access** — permission flags (admin/finance/CRM/active), the
  two areas (Finance & Business), area switcher, launcher home, route protection,
  unified Settings.
- **App shell** — top bar, area-aware side nav, account menu, notification bell
  (placeholder).
- **Finance** — Transactions (CRUD; income/expense/transfer; VAT lines + Net/Total;
  withholding lines; reconcile; invoice 1–13 state; invoice-date; balance view;
  URL-state filters/sort, tri-state sort, per-column header filters, multi-select
  categorical filters; load-as-you-scroll; quick filters; three Add buttons; Excel
  import; default-to-current-month); Entities; Wallets (starting balance + live
  balances); Taxes (VAT ledger, withholding ledger).
- **Business (CRM)** — Leads (list with inline editors, expandable description,
  stretched-link rows, per-row add-action; edit page with campaign fields + main
  contact; History + Contacts sub-tabs); Projects (list, detail, History,
  lead→project conversion, manual "Project Agreed" vs flagged "Converted").
- **Settings** — Account, Appearance (light/dark/system), Categories, VAT rates,
  Withheld tax rates, Lead statuses, Lead origins, Project statuses, Users
  (admin/invites). _(These are the app's own settings — distinct from the starter
  kit's built-in profile/password pages, which we adapt.)_
- **Design system — [DECIDED 2026-08-28] adopt the starter kit's design language**,
  not a reproduction of the old app's visual identity. The owner prefers the clean/
  minimal starter-kit look. The new app is built **on shadcn/ui** ("new-york" style,
  **neutral OKLCH tokens**, **Instrument Sans**, **lucide** icons, light+dark built
  in — verified in the scaffold's `resources/css/app.css` + `components.json`). So
  **parity is functional (same features/behaviour), NOT a visual pixel-match** of the
  old app — the look is a deliberate upgrade. The old app's functional visual cues
  (income/expense colors; the shared table/dialog/inline-edit/action-log patterns)
  are re-expressed within shadcn components (its Table, Dialog, Sidebar, etc.). Font
  and accent color are a few token changes if we ever want to re-tint.

---

## 15. Testing philosophy (first-class)

Owner wants tests for **everything where a test makes sense** per best practices.

- **Unit tests** — isolated logic, especially **tax math** with known-correct
  expected values.
- **Feature tests** — whole flows, including **authorization denial** (§6).
- **Tooling: Pest** **[unverified — confirm which the Laravel 13 kit defaults to
  (Pest or PHPUnit); both are fine]**.
- Written **alongside** each feature. This is how "no loss of functionality"
  becomes provable and how future expansion stays regression-safe.
- Standing rule (Direction 7): after building something, assess whether it warrants
  a test per best practices; if yes, tell the owner and suggest it.

---

## 16. Managing the current live app during the build (new — was missing)

Two codebases will coexist for the whole build.

- **[DECISION NEEDED — recommended: soft feature-freeze]** on the Next app during
  the rewrite: fix bugs, but **avoid new features**, so the parity target stops
  moving. If a new feature is genuinely needed mid-build, it's added to the plan
  and built in both.
- The old app stays the source of truth until cutover (§7).

---

## 17. Hosting / infrastructure (later)

- **[DECIDED 2026-08-28] Vercel is ruled out** — it is the wrong platform for a PHP
  Laravel app (serverless/frontend-oriented; running Laravel on it is hacky). We do
  **not** set up Vercel for the new app.
- **[DECIDED 2026-08-28] Final production hosting + SMTP are the company's infra
  team's job, later**, when the app moves onto company infrastructure.
- **Preview/viewing during development** (interim, until the company hosts it):
  - **Local preview** — the app runs locally (`php artisan serve` + Vite); Claude
    previews it and shows the owner as features are built. Zero setup, immediate.
  - **A shareable URL the owner can open themselves** (the old Vercel habit) — the
    first-party equivalent is **Laravel Cloud** (deploys from GitHub, handles the
    build) **[verified 2026-08-28 it exists and deploys from GitHub]**. Connecting a
    hosting account goes **through the owner** (Claude cannot create/connect hosting
    or billing) — same division of labor as Vercel today. **[CHOSEN 2026-08-28:
    Laravel Cloud]** (~$5/mo, bundled Neon-powered Postgres). Owner created the
    account; connecting the repo is the next step (see §20).
- Preserve the **performance work**: the current DB indexes carry over (plain
  Postgres); keep them in the new migrations.
- Planned future features (recurring transactions, notifications) fit Laravel's
  **queues + scheduler** better than Vercel Cron.

---

## 18. Effort & risk

- This is a **full rewrite of a ~19k-line app with full test coverage** — realistic
  scale is **weeks-to-months**, not "a few weeks." Treat any tighter estimate as
  optimistic until the first Finance features prove a pace.
- Lower-risk than a typical rewrite because: the frontend stack **aligns**
  (React 19/TS/Tailwind); the current app is a **near-complete spec**; the owner is
  the **primary user** and validates parity; and the **one-time cutover with
  fallback** (§7) avoids big-bang data risk.
- Biggest residual risks: the **RLS→app-layer** shift (§6), **user/data migration
  correctness** (§5, §7), and **scope/parity drift** if the old app keeps changing
  (§16).

---

## 19. Open decisions (consolidated)

**Resolved 2026-08-28:**
1. **Political gate** — ✅ owner will lock down roadmap ownership before handover. (§1)
2. **Repo** — ✅ new separate repo `Angel-Pappas/yolt-app-new` (exists, empty).
   Pending: flip it **public → private**. (§9)
3. **Auth** — ✅ Fortify (skip WorkOS). (§2)
4. **Views** — ✅ replace `transactions_expanded`/`wallet_balances` with Eloquent. (§5)
5. **Feature-freeze** the old app during the build — ✅ yes. (§16)
6. **Vercel** — ✅ ruled out (wrong platform for Laravel). (§17)
7. **Final hosting + SMTP** — ✅ deferred to the company's infra team, later. (§9, §17)
8. **Accountant re-verification** of the Greek tax rules — ✅ owner will verify. (§12)
9. **Database engine** — ✅ **MySQL 8.4** (company standard; ~90% confirmed, DB empty
   so reversible). Implies a Postgres→MySQL data conversion at cutover. (§5, §7)
10. **Interim host** — ✅ **Laravel Cloud**: app deployed and **live**, MySQL 8.4 DB
    attached, **registration/login verified end-to-end**. Push-to-deploy active. (§20)

**Still open:**
- **Confirm the company's DB standard** (the ~10%) — settles the MySQL choice. (§5)
- **Repo visibility** — `yolt-app-new` is public; Laravel Cloud supports private, so
  it can be made private if desired (owner's choice — not required). (§9)
- **RLS defense-in-depth** — moot on MySQL (no RLS); authz is app-layer + tests. (§6)
- **Confirm at build:** `updated_at` columns per table (§5); Excel library +
  Laravel 13 compat (§12); type-safety for Inertia page props; **align local dev DB
  to MySQL** (scaffold used SQLite). (✅ Pest chosen; ✅ toolchain installed.)

---

## 20. Progress log

- **2026-08-28** — **Toolchain installed** on the dev machine (verified current/
  proper versions): **PHP 8.4.24** (php.ini configured: openssl, mbstring, curl,
  fileinfo, pdo_sqlite, sqlite3, pdo_pgsql, pgsql, zip, intl, bcmath),
  **Composer 2.10.3**, **pnpm 11.24**, **Laravel installer 5.32**. **Scaffolded the
  app fresh** — **Laravel 13.29 + the official React starter kit** (React 19, TS,
  Inertia 3, Tailwind 4, shadcn/ui, vite-plus, **Fortify** auth, **Pest**), SQLite
  for local dev. **Verified:** frontend builds cleanly; **39 Pest tests pass**.
  **Pushed** to `Angel-Pappas/yolt-app-new` (`main`).
- **2026-08-28 (later)** — **Deployed to Laravel Cloud.** Owner created the app
  (`production` env, Frankfurt / `eu-central-1`), attached a **MySQL 8.4** serverless
  database (Dev config — 512 MiB, sleeps when idle), and deployed. Fixed a CI
  formatting failure (`vp check --fix`) → GitHub Actions green. **App is live** at
  `yolt-app-new-production-ximjo9.laravel.cloud`; **registration + login verified
  end-to-end** (proves MySQL connected + migrations ran). **Push-to-deploy active.**
  Foundation complete.
- **2026-08-28 (build begins)** — First feature increment: the **access-control
  model** — four permission flags on `users`
  (`is_admin`/`can_access_finance`/`can_access_crm`/`is_active`), authorization
  **gates** (`admin`/`access-finance`/`access-crm`, each requiring active), and an
  **`EnsureAccountIsActive`** guard that logs out deactivated users. Added the new
  repo's **`AGENTS.md`** (its engineering-log/guidance doc). **7 new tests** (46
  total); all CI checks green (Pint / PHPStan / Pest / vp check / tsc); pushed +
  deployed.
- **2026-08-28 (areas + shell)** — Built the **two areas** and the **access-aware
  app shell**: route gating (`/transactions` via `can:access-finance`, `/leads` via
  `can:access-crm`), the sidebar's **Finance/Business nav groups render per access**,
  a **launcher** (dashboard) with area cards, placeholder area pages, and a
  **`user:promote {email}`** artisan command to bootstrap the first super admin.
  **53 tests** (7 new); all CI green; deployed.
- **2026-08-28 (user management)** — Admin **Settings ▸ Users** screen: list all
  users with inline toggles for Admin / Finance / Business / Active (self can't drop
  own admin or deactivate self — guarded server-side + disabled in the UI); the
  "Users" nav entry shows for admins only. Colleagues self-register (open
  registration for now); an admin grants access here — no SMTP needed. **58 tests**
  (5 new); all CI green; deployed. (Invite-only signup + email invites deferred
  until SMTP exists — company/later.)
- **2026-08-28 (finance reference data)** — Built the finance lookup entities:
  **Wallets** (name + starting balance), **Entities** (name + VAT number),
  **Categories** (name + income/expense type), **VAT rates** and **Withheld tax
  rates** (name + rate %) — all CRUD, `can:access-finance`-gated, soft-delete, in the
  Finance sidebar. Extracted a reusable **`CrudResource`** component (config-driven
  table + add/edit dialog + delete; text/decimal/select fields) used by
  Categories/VAT/Withheld. Schema uses **bigint PKs** (existing UUIDs remapped at the
  cutover conversion — see §5/§7). **93 tests** total; all CI green; deployed.
  built in slices.
- **2026-08-28 (transactions — first slices)** — **Data model**: transactions +
  transaction_vat_lines + transaction_withheld_lines tables + models with
  relationships (bigint PKs). **List view**: `TransactionController@index` + a table
  (Type/Date/Wallet/Category/Entity/Description/Net/VAT/Total); shared Greek-style
  `resources/js/lib/format.ts` (formatAmount 1.234,56; formatDate dd/mm/yyyy).
  **Entry form (income/expense)**: `store` computes each VAT line's amount from the
  rate's current % **server-side** (never trusted from the client), sums net/vat,
  writes the transaction + lines in a DB transaction; a dialog with type/date/
  invoice-date/entity/category (filtered by type)/wallet/net/VAT-rate/description +
  a live Net/VAT/Total preview. **104 tests**; all CI green; deployed. **Still to do
  on Transactions:** transfers, multi VAT lines + Net/Total toggle, withholding
  lines, edit/delete, reconcile, invoice-month, filtering/sorting, balance view —
  then Taxes (VAT + withholding ledgers), the Business/CRM area, and the import.
- **2026-08-31 (transactions — CRUD, transfers, balances)** — Transactions now have
  **full CRUD** (edit + delete, soft-delete; a shared validate/persist that rewrites
  the VAT lines wholesale), **transfers** (from/to wallet, no VAT; a type change on
  edit clears the other shape), and **live wallet balances** (a reusable
  `App\Support\WalletBalances` service; a Balance column on the Wallets page + shared
  Greek `formatAmount`). **114 tests**; all CI green; deployed. **Still to do on
  Transactions:** multi VAT lines + Net/Total toggle, withholding lines, reconcile /
  invoice tagging, filtering/sorting, per-wallet balance view — then Taxes, CRM,
  import.
- **2026-08-31 (transactions — filtering/search)** — the Transactions list now
  filters by free-text search (description OR entity name, debounced), type, wallet
  (matching both sides of a transfer), and a date range, all via URL query params
  read server-side in `TransactionController@index` (a `filters` prop drives the new
  `transactions-filters.tsx` toolbar; a Clear button when any is active). **118
  tests**; all CI green; deployed.
- **2026-08-31 (transactions — withholding tax)** — income/expense transactions can
  now carry **Greek withholding tax** (παρακράτηση), modelled as the exact parallel
  of VAT lines: an optional withholding "line" (base + `withheld_tax_rates` rate)
  whose amount is computed server-side (`resolveWithheldLines`, never trusted from
  the client) and summed into `transactions.withheld_amount`; the cash **Total = net
  + VAT − withheld**. The form gained a Withholding base + rate pair (income/expense
  only) and a 4-column Net/VAT/Withheld/Total preview; `withheldLines` are
  eager-loaded for edit pre-fill and rewritten wholesale on save (cleared on a type
  change or when withholding is removed). `resolveLines` renamed `resolveVatLines`
  for symmetry. **123 tests**; all CI green; deployed. **Still to do on
  Transactions:** multi VAT lines + Net/Total toggle, reconcile / invoice tagging,
  per-wallet balance view — then Taxes (VAT + withholding ledgers), CRM, import.
- **2026-08-31 (transactions — per-wallet balance view)** — a **Balance view**
  control on the Transactions page: picking a wallet sets `?balance=<id>` and the
  same table narrows to that wallet's history with the Wallet column swapped for a
  running **Balance** column. `WalletBalances::runningFor()` walks the wallet's
  *complete* chronological history (seeded from `starting_balance`; income/expense
  move net+VAT−withheld, a transfer moves net on both sides) annotating each row;
  the display filters are then applied in PHP, so a filtered view still shows
  correct cumulative balances. The active search/type/date filters are preserved on
  enter/exit; the wallet filter is hidden while in balance view. **127 tests**; all
  CI green; deployed. **Still to do on Transactions:** multi VAT lines + Net/Total
  toggle, reconcile / invoice tagging — then Taxes (VAT + withholding ledgers),
  CRM, import.
- **2026-08-31 (Taxes area — VAT + withholding ledgers)** — the **Taxes** section
  (side-nav link, finance-gated): a `/taxes` index with a card per tax type showing
  the current period's headline figures, and a full month-by-month page each.
  **`VatLedger`** walks the complete history chronologically (by `invoice_date`),
  threading a **credit rollover** (negative net carries forward indefinitely) and
  **two-installment** deferral (a debit over €100 splits half-now/half-next-month,
  ≤€100 paid in full) — gap months emitted so state passes through them; columns
  Month / Income VAT / Expenses VAT / Net / Roll over / Payable this month / Payable
  next month. **`WithheldLedger`** is the simpler parallel (by payment `date`,
  expense-side only): collected this month → payable next. Both are derived live,
  never stored. **Tests caught a real bug** — `Carbon::createFromFormat('Y-m', …)`
  inherits today's day-of-month and overflows a short month (Feb on the 31st → Mar);
  fixed by anchoring to `-01`. **141 tests** (12 new ledger tests covering rollover,
  installments, gap months, payment-date attribution); all CI green; deployed.
  **Deferred:** month→transactions drill-down links (needs an `invoice_date` filter
  on the transactions list, not yet built). **Still to do on Transactions:** multi
  VAT lines + Net/Total toggle, reconcile / invoice tagging — then CRM, import.
- **2026-08-31 (Business/CRM — lead statuses & origins lookups)** — first CRM slice,
  the foundation Leads will reference. Two `can:access-crm`-gated lookup lists —
  **`lead_statuses`** (New/Contacted/Follow-up/Proposal/Won/Lost) and
  **`lead_origins`** (Campaign/Ads/Expo/Referral/Website) — each `name` + `position`
  (a new status/origin appends at max+1), built on the existing `CrudResource`
  pattern (mirrors VAT rates), with side-nav links under Business. An idempotent
  **`LeadLookupSeeder`** (firstOrCreate, safe to run against prod) seeds the
  defaults. **148 tests** (7 new: CRUD, position append, access gating, seeder
  idempotency); all CI green; deployed. **Next CRM slices:** Leads list + CRUD, then
  lead detail (contacts + activity log), Projects, and lead→project conversion.
- **2026-08-31 (Business/CRM — Leads list + CRUD)** — the core Leads feature: a
  `leads` table (auto **No.** `sort_order` assigned at `withTrashed()->max+1` so a
  soft-deleted lead keeps its number — **never reused**; a test caught that the
  default soft-delete scope would otherwise reset it), origin/status FKs to the
  lookups, a lead-level website, and a **main contact** (`contact_*` columns:
  name/position/email/phone/landline), description, next step. A list page (No. /
  Origin / Name / Email / Phone / Next step / Status + edit/delete) with a
  search+origin+status filter bar, and a full add/edit dialog (name, origin/status
  selects, main-contact fieldset, description/next-step textareas — added a shadcn
  `Textarea` component). **155 tests** (7 new: CRUD, auto-No. append, never-reused,
  validation, filter/search, access gating); all CI green; deployed. **Deferred to
  later CRM slices:** additional contacts + activity-log (History) sub-tabs on a
  lead detail page, campaign-only fields (platform/we-are/we-want), inline
  next-step/status editing, phone formatting — then Projects and lead→project
  conversion.
- **2026-08-31 (Business/CRM — lead detail page + activity log)** — a `/leads/{lead}`
  detail page (lead name links to it from the list): a header with the auto No., the
  full lead info card, an "Edit lead" button reusing the `LeadFormDialog`, and a
  **History** log. `lead_actions` (nested under a lead, `cascadeOnDelete`) has an
  editable **`action_date`** (defaults today, separate from the `created_at` audit
  stamp) and a denormalized **`author_name`** (a colleague's name can't be joined
  under the CRM's shared-read model; author = the acting user). `LeadActionController`
  store/update/destroy guard that the action belongs to the lead in the URL (404
  otherwise); an `ActionFormDialog` (date + body) drives add/edit. **161 tests** (6
  new: detail render, log/attribution, validation, update/delete, wrong-lead 404,
  access gating); all CI green; deployed. **Deferred:** admin actor-picker (attribute
  an action to another user), the Contacts sub-list, inline next-step/status editing,
  campaign fields — then Projects and lead→project conversion.
