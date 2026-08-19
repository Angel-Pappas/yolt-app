# yolt-app

An all-encompassing company app split into two areas: **Finance** (a transactions /
VAT / wallets tracker) and **Business** (a CRM — leads). Multi-user, permission-gated,
built on Next.js + Supabase.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres + Auth + RLS) — cloud-hosted, shared across machines
- **Zod** for Server Action validation
- Deployed on **Vercel** (auto-deploys on push to `main`)

> Next.js 16 has real breaking changes vs. older versions (e.g. middleware is now
> `proxy.ts`). See `AGENTS.md` — the bundled docs under `node_modules/next/dist/docs/`
> are the source of truth before writing code.

## Prerequisites

- **Node.js 20.9+** (Next 16 requires it; Node 20 LTS or newer)
- **npm** (a `package-lock.json` is committed — use `npm ci` for reproducible installs)
- **git** (pushes go to `main` via HTTPS + a credential manager)

## Setup on a new machine

```bash
git clone https://github.com/Angel-Pappas/yolt-app.git
cd yolt-app
npm ci                     # or: npm install
cp .env.example .env.local # then fill in the two values (see below)
npm run dev                # http://localhost:3000
```

### Environment variables

`.env.local` is gitignored. Copy `.env.example` and fill in:

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API (Project URL) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Project Settings → API (publishable/anon key) |

Both are `NEXT_PUBLIC_*` (safe to expose to the browser). The same values are set in
the Vercel project dashboard. There is **no local database** — the app talks to the
shared cloud Supabase project, so no DB install/migration step is needed.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) at `http://localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check without emitting |

## Database

Schema lives only in the cloud Supabase project (there is **no** `supabase/migrations/`
folder — schema is managed directly). `src/lib/supabase/database.types.ts` is generated
from the live schema (via the Supabase MCP `generate_typescript_types`) and must be
regenerated after any schema change — never hand-edit it long-term. All tables use RLS
and soft-deletes; nothing is hard-deleted through the app.

## Project docs (read these before making changes)

- **`Summary.md`** — the canonical, always-current description of every feature, table,
  and convention. Start here to get up to speed.
- **`Directions.md`** — standing rules that must always be followed (commit & push to
  `main` when done; let the user do visual checks; keep all tables on the shared table
  template; never let modals scroll sideways; etc.).
- **`AGENTS.md`** — the Next.js 16 caveat.
- **`CLAUDE.md`** — loads the three files above for AI assistants.
- **`Plan-Multi-User-and-CRM.md`** — the multi-user + CRM build plan.
