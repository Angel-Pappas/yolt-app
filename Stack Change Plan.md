# Stack Change Plan

This is the authoritative planning document for migrating **Yolt-App** from its
current stack (Next.js + Supabase) to the company's stack (**Laravel + React**).
It records every decision and detail agreed so far. Keep it current: update it
whenever a decision changes or a new one is made, and **verify every technical
fact in it against live/official sources before relying on it** (see the
working-discipline section — this document is not exempt from that rule).

_Started: 2026-08-28. Status: **planning only** — no build work started yet._

---

## 1. Why we are doing this (the driver)

The reason is **strategic/organizational, not technical dissatisfaction** — the
current app works well and was just audited clean.

- The app is growing: the new **Business/CRM** part means **other people in the
  company will start using it** (they use it mostly for information; the owner is
  the main power-user).
- The company works in **PHP/Laravel**. The team objects that this app is on a
  different stack and has floated **building their own app instead**.
- The owner's goals, in order:
  1. **Remove the "wrong stack" objection** by moving to the company's stack.
  2. Position the app to later be **incorporated into the company's
     infrastructure**.
  3. **Keep control** over the app's expansion and shaping — the owner intends to
     remain the person who drives its roadmap.
- **Caution to plan around:** once the app lives on company infrastructure,
  "control" becomes partly *organizational*, not just technical. Roadmap
  ownership should be pinned down **before** handing over infra, not after. Keep
  the codebase clean, documented, and clearly owned.

---

## 2. Target stack (verified 2026-08-28)

> Verified via official/live sources on 2026-08-28. Re-verify before scaffolding,
> since versions move.

- **Laravel 13** — current major release (13.10.0 released 2026-08-17; released
  ~March 2026). Minimum **PHP 8.3**.
- **Official React starter kit** — scaffolded with
  `laravel new <app> --starter-kit=react`.
  - Stack: **React 19, TypeScript, Inertia 3, Tailwind CSS, shadcn/ui, Vite**.
  - Ships with auth flows, a dashboard, settings pages, and the shadcn/ui
    component library already wired under `resources/js/pages/`.
- **Auth: Laravel's built-in authentication** (from the starter kit), replacing
  Supabase Auth entirely. The owner explicitly approved replacing the login and
  the users with Laravel's own.
- Sources checked: laravel.com/docs/13.x/releases, laravel.com/docs/13.x/starter-kits,
  github.com/laravel/react-starter-kit, laravel-news.com/laravel-13.

### Notable version corrections already caught by verifying
- Latest Laravel is **13**, not 12 (an earlier memory-based claim was wrong).
- The React starter kit uses **Inertia 3**, not Inertia 2 (also a memory error).
- These two catches are exactly why the "always verify, never trust memory" rule
  (below) exists.

---

## 3. Architectural model (Inertia)

With the Inertia-based React starter kit:

- **No separate API is built.** A **Laravel controller** queries the database
  (Eloquent/PHP) and passes data as **props** to a **React page component**,
  which renders it. Form submissions go to Laravel routes (via Inertia's
  `useForm`), which run the business logic in PHP and redirect back with fresh
  data.
- **React becomes purely the view layer; 100% of data access and business logic
  lives in PHP.** This is simpler than today, where logic is split across Server
  Components, Server Actions, and Supabase client calls.
- Mapping of today's Next.js concepts → Laravel/Inertia:
  - Server Components (fetch-in-component) → Laravel controllers feeding props.
  - Server Actions (`"use server"`) → Laravel routes + Inertia forms.
  - `revalidatePath` → Inertia's automatic prop refresh / redirects.
  - App Router + route groups + `layout.tsx` → Laravel routes + persistent
    Inertia layouts.
  - `proxy.ts` (middleware) → Laravel middleware.
  - Supabase JS data calls everywhere → Eloquent/DB queries in PHP (the Supabase
    client disappears from the frontend entirely).

---

## 4. Approach — a full, from-scratch rewrite (NOT a port)

**This is a clean rebuild, written as if the app were being created for itself in
Laravel from day one.** Explicit owner direction, and the guiding rule for the
whole project:

- **The current app is a *reference/specification*, not a source to copy.** We
  look at it to answer "what should this screen look like / how should this
  behave," then **build each piece fresh and idiomatic** in Laravel + Inertia +
  React.
- **No file ports. No copy-paste.** Nothing Next.js-shaped survives. Every page
  starts as a Laravel controller + an Inertia page written the Laravel-native
  way — never old code with the edges filed off.
- Recreating the **same look** means writing **new Tailwind** that achieves the
  same appearance (rebuild-to-match, not copy). This is natural because the
  starter kit is already React 19 + TypeScript + Tailwind — the same family the
  current app uses.
- **Guard against the "patch it together" loop:** build each feature the
  idiomatic way *first*, then compare against the reference for parity — never
  start from pasted code and patch until it works. (This was a specific concern
  the owner raised, and it is a real risk to actively avoid.)

---

## 5. Data — keep it all; build to the existing DB; load data last

- **All business data stays exactly as it is** — transactions, transaction VAT
  lines, transaction withheld lines, entities, wallets, VAT rates, withheld-tax
  rates, categories, leads, lead statuses/origins/contacts/actions, projects,
  project statuses/actions, profiles, etc. The new app is **built to the existing
  Postgres schema**.
- The **only** part that cannot stay as-is is the **auth plumbing**, because it is
  Supabase-specific: the managed `auth.users` table, the `private.*` RLS helper
  functions, and the RLS policies. These are **rebuilt the Laravel way**, and the
  **user accounts are migrated** into Laravel's `users` table (bcrypt password
  hashes are likely portable; worst case, a one-time password reset for a handful
  of users). The owner approved this.
- **Security model shift:** database-enforced **RLS** → Laravel **application-layer
  authorization** (Policies/Gates + query scopes), backed by tests. (Keeping RLS
  as optional defense-in-depth is possible but is not the Laravel idiom and is not
  planned unless we decide otherwise.)
- **Sequence (owner's ordering):** build the app from the ground up against a
  **copy** of the real schema → get it looking/working/feeling the same → then, as
  the **final** step, do the real **data cutover**. We design against the true
  schema from day one, but the live data comes in last.

---

## 6. Build sequence (planned)

1. Scaffold `laravel new <app> --starter-kit=react` (Laravel 13). Re-verify the
   version at scaffold time.
2. Stand up the **engineering-log discipline** (the Laravel equivalent of
   `Summary.md` — verified versions, chosen approaches, source links; kept
   current).
3. Connect the app to a **copy of the existing Postgres schema**.
4. Build **auth + the permission model** first (RLS → Policies/Gates + query
   scopes; the two-area Finance/Business access flags; admin; invites).
5. Build the **Finance area first** (Transactions is the core, and the owner is
   its main user), feature by feature — **each with tests**, each **checked for
   parity** against the current app.
6. Then **CRM** (Leads, Projects), then **Settings**, then the **import tool**.
7. Build to look/work/feel the same; **real data cutover is last**.
8. **Parallel-run** both apps against the shared data, verify, then cut over.

---

## 7. Business logic to re-implement in PHP (each with tests)

Re-implemented from scratch in PHP, verified against the current app's behavior:

- VAT lines — multi-rate, single Net/Total mode for the whole transaction;
  Total-mode `vat_amount` anchored to `total − net` (avoids the double-rounding
  bug the current app documents).
- Withholding-tax lines (parallel to VAT lines; always on net; optional).
- `computeTotal` = `net + vat_amount − withheld_amount`.
- **Greek VAT monthly ledger** — chronological walk with **credit rollover**
  (negative net carries forward) and **installments** (a debit > €100 splits into
  2 equal interest-free parts, half now / half next month; ≤ €100 paid in full),
  including gap-month walking. (Installment option always treated as taken.)
- **Withholding remittance ledger** — collected this month → payable next month,
  attributed to the **payment date** (not invoice date).
- **Running wallet balances** — `starting_balance` + each active transaction's
  signed effect.
- **Invoice-month 1–13 resolution** (13 = "no invoice needed").
- **Invoice-date** VAT-period attribution (VAT belongs to the invoiced month).
- **Excel import** (→ Laravel Excel / PhpSpreadsheet) — the fixed spreadsheet
  format, the 1–13 "Bacon" column, wallet aliases, auto-creating missing
  entities/categories/wallets, chunked writes, per-row failure reporting.
- **Soft-delete** conventions across every table (no hard delete in the app).
- Greek-style formatting (dd/mm/yyyy dates, `.` thousands / `,` decimal), the
  locale-independent segmented date field, and comma-or-dot amount inputs.

---

## 8. Feature inventory to reproduce (parity checklist)

The new app must look, work, and feel the same. High-level surfaces to reach
parity on (see the current app's `Summary.md` for the full behavioral spec):

- **Auth** — login, password reset, email verification, invite flow, set-password;
  public signup closed.
- **Multi-user, areas & access control** — profiles/permission flags
  (admin / finance / CRM / active), the two areas (Finance & Business), the area
  switcher, the launcher home, route protection, unified Settings.
- **App shell** — top bar, side nav (area-aware), account menu, notification bell
  (placeholder).
- **Finance:**
  - **Transactions** — full CRUD; types (income/expense/transfer); VAT lines +
    Net/Total toggle; withholding lines; reconcile; invoice (1–13) state;
    invoice-date; balance view (per-wallet running balance); filters/sort (URL
    state, tri-state sort, per-column header filters, multi-select categorical
    filters); load-as-you-scroll; quick filters; the three Add buttons; the Excel
    import; default-to-current-month.
  - **Entities**, **Wallets** (with starting balance & live balances).
  - **Taxes** — VAT monthly ledger, withholding ledger.
- **Business (CRM):**
  - **Leads** — list (inline next-step/status editors, expandable description,
    stretched-link rows, per-row add-action), edit page (fields, campaign-only
    fields, main contact), History sub-tab, Contacts sub-tab.
  - **Projects** — list, detail, History, lead→project conversion, the
    manual "Project Agreed" vs flagged "Converted" states.
- **Settings** — Account, Appearance (theme: light/dark/system), Categories, VAT
  rates, Withheld tax rates, Lead statuses, Lead origins, Project statuses, Users
  (admin/invites).
- **Design system** — the token-based theming, the shared **table template**, the
  shared **dialog/form template**, shared table/inline-edit/action-log components,
  pills, icons, segmented controls.

_(This is a checklist to build and verify against, one feature at a time — not a
license to port any of it.)_

---

## 9. Testing philosophy (a first-class goal)

The owner wants **as many tests as make sense** — tests for every single thing
where a test is warranted from a developer's perspective and per field best
practices.

- **What tests are:** code that automatically checks the app does what it should,
  run on command in seconds — instead of manual clicking.
- **Kinds we will use:**
  - **Unit tests** — one piece of logic in isolation, especially the **tax math**
    with known-correct expected values (e.g. "€1,000 net @ 24% → €240 VAT, €1,240
    total"; "a €150 VAT debit → two €75 installments").
  - **Feature tests** — whole flows, including **authorization** (e.g. "a non-CRM
    user is blocked from Leads"; "an expense of €124 drops the wallet balance by
    €124").
- **Tooling:** Laravel's first-class testing, using **Pest** (the modern idiom).
  Re-verify the current recommended tooling at build time.
- **When:** tests are written **alongside** each feature, not after. They are how
  "identical behavior, no loss of functionality" becomes *provable* rather than
  hoped-for, and how the owner's ongoing expansion stays safe from regressions.
- **Standing rule (added to Directions):** after building something, check current
  best practices and decide whether it warrants a test; if yes, tell the owner and
  suggest building it.

---

## 10. Working discipline (verify & document)

- **Always assume memory is wrong and verify.** Never state a version, API, or
  "the right way to do X" from memory — look it up against official/current
  sources first. Treat any such claim made without a lookup as a bug.
- **Document what is verified** — record verified facts, chosen approaches, and
  source links in the project's engineering log (the Laravel-side equivalent of
  `Summary.md`), and keep it current.
- **Consult that documentation first; when it is silent, search online again.**
- This mirrors the existing `AGENTS.md` instinct ("This is NOT the Next.js you
  know — read the guide before writing any code").

---

## 11. Hosting / infrastructure (later)

- Move off **Vercel + Supabase** to **Laravel infrastructure** (Laravel Forge /
  Laravel Cloud / the company's own infra — to be decided). Co-locating the app
  and the database removes the current cross-region latency concern.
- Planned future features become easier on Laravel: **recurring transactions** and
  **notifications** fit Laravel's **queues + scheduler** better than Vercel Cron.

---

## 12. Effort & risk framing

- This is a **full rewrite**, multi-week, **feature by feature** — not a port and
  not a weekend job.
- It is one of the **more tractable** rewrites because:
  1. The frontend stack **aligns** (React 19 / TypeScript / Tailwind on both
     sides).
  2. The current app is a **near-complete functional spec** (`Summary.md`).
  3. The owner is the **primary user** and can validate parity feature by feature.
  4. A **parallel-run cutover** avoids any big-bang data risk.

---

## 13. Open items / decisions still to make

- Exact hosting target (Forge vs Laravel Cloud vs company infra).
- Whether to adopt shadcn/ui components or rebuild the current design system's
  components against the same look (leaning: keep the current design system's
  look, use shadcn selectively — to be decided at build time).
- Whether to keep RLS as optional defense-in-depth (default: no).
- Password-hash portability (confirm bcrypt compatibility vs one-time reset).
- Type safety for Inertia page props (how to carry DB types into the React side).
