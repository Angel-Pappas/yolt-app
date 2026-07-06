# Summary

This file exists so a fresh session can get up to speed on this app quickly. Keep it current: update the relevant section whenever a major feature is added, removed, or changed.

## General description

Yolt is a personal financial transactions tracker, built for a single user (the app owner only — no multi-tenant/sharing features are planned). It currently supports logging basic transactions (date, amount, description) behind email/password authentication. Planned future features include financial projections and automatic generation of recurring transactions, plus whatever else comes up as the app grows.

## Main sections of the app

- **Authentication** — Signup, login, and logout. Email/password via Supabase Auth, including the email-confirmation flow. Pages: `/login`, `/signup`, `/auth/confirm` (confirmation link handler), `/auth/auth-code-error` (expired/invalid link fallback).
- **Home** (`/`) — Minimal landing page after login. Placeholder content for now.
- **Transactions** (`/transactions`) — Full CRUD on transactions (date, amount, description): list with an "Add" button (text) and per-row Edit/Delete as icon-only buttons (pencil/trash, `src/components/icons.tsx`, inline SVG — no icon library dependency), all backed by RLS-scoped Server Actions (`actions.ts`: `addTransaction`, `updateTransaction`, `deleteTransaction`). Add/Edit share one modal component (`transaction-modal.tsx`, native `<dialog>` with unique field ids via `useId` so multiple instances can exist per row); delete has a native `confirm()` prompt (`delete-transaction-button.tsx`). Icon-only buttons carry `aria-label`s for accessibility.
- **Options** (`/options`) — Account settings: shows the current email and has forms to update email (triggers Supabase's email-change confirmation flow) and password (`src/app/(app)/options/actions.ts`). Status/error messages passed via `?message=` query param, same pattern as login/signup.
- All three pages above share a common app shell (`src/app/(app)/layout.tsx`, a route group) with a nav bar (Home / Transactions / Options / Log out).

## Technical sections

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, ESLint. Scaffolded with `create-next-app`.
- **Data/validation libs installed for future use**: `@tanstack/react-query`, `zod` (not yet wired into any feature).
- **Auth/session plumbing**: `@supabase/ssr` with three client setups:
  - `src/lib/supabase/client.ts` — browser client
  - `src/lib/supabase/server.ts` — server client (Server Components/Actions)
  - `src/lib/supabase/proxy.ts` + `src/proxy.ts` — session-refresh and route protection. Next.js 16 renamed "middleware" to "proxy" (file `proxy.ts`, function `proxy`) — this app follows that convention. Auth check uses `supabase.auth.getClaims()` (not `getSession()`/`getUser()`), per current Supabase guidance.
  - Unauthenticated visitors are redirected to `/login` for any route except `/login`, `/signup`, and `/auth/*`.
- **Page structure**: `src/app/(app)/` is a route group holding the authenticated app shell — `layout.tsx` (nav bar), `page.tsx` (Home, `/`), `transactions/page.tsx` + `transactions/actions.ts` (`/transactions`), `options/page.tsx` (`/options`). Route groups (parens in the folder name) don't add a URL segment. `/login`, `/signup`, and `/auth/*` live outside this group (no nav bar).
- **Database**: Supabase Postgres. Project `yolt-app`, ref `mzfxfweljbfvyqlhvmzr`, region `eu-west-1`, free tier, org "Angel-Pappas's Org" (`yowsydnsxjwcujsjwtji` — same org as the Exalted-Character-App project).
  - Table `public.transactions`: `id` (uuid pk), `user_id` (uuid, defaults to `auth.uid()`), `date` (date), `amount` (`numeric(12,2)` — exact decimal, not float, so no cents-as-integer conversion needed), `description` (text), `created_at` (timestamptz). RLS enabled, all policies scoped to `auth.uid() = user_id`.
- **Hosting/deploy**: Vercel, connected to GitHub repo [Angel-Pappas/yolt-app](https://github.com/Angel-Pappas/yolt-app), auto-deploys on push to `main`. Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) are set directly in the Vercel dashboard (mirrors `.env.local`, which is gitignored; `.env.example` is committed as a template).

## Formatting conventions

Greek-style formatting is used everywhere the app displays dates/numbers: dates as `dd/mm/yyyy`, numbers with `.` as the thousands separator and `,` as the decimal separator, always rounded to exactly 2 decimals. Shared helpers live in `src/lib/format.ts` (`formatDate`, `formatAmount`) — use these instead of ad-hoc formatting whenever displaying a date or amount anywhere in the app. Native HTML form inputs (`<input type="date">`, `<input type="number">` in the add-transaction modal) are exempt — their `value` must stay ISO/period-decimal per the HTML spec, only their on-screen picker rendering is browser/OS-locale-dependent, and that isn't something the app controls.

## Notes to myself

- This is a single-user app. Don't add roles/teams/sharing/multi-tenant complexity unless explicitly asked — but keep RLS correct regardless, it's good practice regardless of user count.
- Money is stored as Postgres `numeric(12,2)`, which is exact fixed-point decimal — no floating-point rounding risk. Don't "fix" this into cents/bigint, it's already correct as-is.
- Next.js 16 has real breaking changes vs. training-data knowledge (biggest one: `middleware.ts` → `proxy.ts`). The bundled docs at `node_modules/next/dist/docs/` and Supabase's own docs (via the Supabase MCP `search_docs` tool) are the source of truth — check them before assuming an API when working with newer package versions.
- This dev machine (Sofoklis's Windows box) didn't have Node.js or the GitHub CLI installed originally; both were installed via `winget`. `gh` is installed but **not authenticated** — git push/pull works through Git Credential Manager (`credential.helper=manager`), which is already authenticated, not through `gh`.
- No Vercel CLI/token is set up locally. Vercel project settings (env vars, redeploys) go through the user in the dashboard — not automatable from a coding session right now.
- PowerShell tool calls in this environment don't inherit PATH updates made mid-session (e.g. after a `winget install`). If a newly installed CLI isn't found, refresh with:
  `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
  at the start of the same PowerShell command block.
- User's standing rules (see also memory): never use any email address (including the user's own) without asking first — use `example@example.com` for placeholders/tests. Don't drive a browser to visually test changes — verify via build/lint/typecheck only and let the user do functional/visual testing.
- Sibling project: `Exalted-Character-App` (Vite + React SPA, different stack) — not related to this app beyond sharing the same Supabase org and GitHub account.
- Discussed-but-not-built-yet: accounts, categories, editing/deleting transactions, financial projections, automatic recurring transaction generation (likely approach: a `recurring_rules` table + a daily Vercel Cron job hitting an API route).
