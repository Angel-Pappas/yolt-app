# Plan — Multi-User, Roles & the Business (CRM) Area

This document is the agreed plan for turning Yolt-App from a single-user financial
tracker into a multi-user company app with two "areas" (Finance and Business/CRM),
role-based access, and an admin who manages users.

It has two layers:

- **Part 1–3** are written in plain, non-developer language: what we're building,
  the big decisions and *why*, and the phase-by-phase plan you can follow along.
- **Part 4** is a technical reference for the implementer (me) — schema sketches,
  security patterns, gotchas. You can skip it; it's my working notes.

Nothing in here is built yet. This is the map we build from. As each phase actually
ships, its details get folded into `Summary.md` (the app's living description), and
this plan gets ticked off.

---

## Part 1 — The big picture (plain language)

Right now the app is **single-user**: everything belongs to your one account, and
only you can see it. We're changing three big things:

1. **Data becomes company data, shared by permission.** Your 856 transactions stop
   being "yours" and become "the company's books," visible to anyone you've given
   finance access to. Who *created* a row is still remembered (for history), but it
   no longer controls who can *see* it.

2. **The app splits into two areas.** A **Finance** area (everything that exists
   today — transactions, wallets, taxes, etc.) and a new **Business** area (the CRM
   — leads, and room to grow). When you log in you pick which one you're working in,
   like switching between Gmail and Calendar in Google Workspace. You only see the
   areas you're allowed into.

3. **People and permissions.** There's a **super admin** (you) who can add users by
   email and decide, per person, whether they can see Finance, Business, or both.
   Added users get an email invite, set their own password, and log in. A settings
   area — reachable from anywhere — lets each person manage their own account, and
   lets finance/business users manage the lookup lists for the areas they can access.

Everything is designed to leave room for what's coming later (financial projections,
automatic recurring transactions, more tax types, a real notifications system,
projects and project-states in the Business area) without needing to be rebuilt.

---

## Part 2 — The key decisions, and why

These are the choices that shape everything. Written so you understand the reasoning,
not just the outcome.

### Decision A — How we store "who can do what": a simple profile per user

Every user gets a **profile** record holding a few on/off switches:
`is_admin`, `can_access_finance`, `can_access_crm`, plus an `is_active` switch so a
user can be turned off without being deleted.

There's a fancier industry pattern (roles + permissions tables, permissions baked
into the login token). I deliberately **did not** use it, for two reasons:
- It's built for products with dozens of fine-grained permissions. We have, in
  effect, three switches. That machinery would be over-engineering.
- Baking permissions into the login token means that when you change someone's
  access, **it doesn't take effect until their token refreshes** (up to an hour, or
  a re-login). With a profile record read fresh each time, **flipping a switch
  applies immediately** — which is what you'd expect as an admin.

This keeps things simple *and* correct, and if we ever genuinely need fine-grained
permissions, we can grow into them without rewriting the app.

### Decision B — Shared data is enforced at the database, not just the app

Today the database rule is "you can only see rows you own." We change it to "you can
see finance rows **if your profile has finance access**" (and likewise for CRM). This
rule lives in the **database itself** (Row-Level Security), so even a bug in the app
can't leak the wrong area's data to the wrong person. The app's screens and menus
*also* hide what you can't access — but the database is the real lock.

### Decision C — Areas are a *view* concept, not a change to web addresses

The Finance pages keep their current addresses (`/transactions`, `/wallets`, …). We
are **not** renaming them to `/finance/transactions` — that would break every saved
link and bookmark. "Which area you're in" is decided by which page you're on and
shown clearly in the top bar, with a switcher to jump between areas. New Business
pages get their own new addresses (e.g. `/leads`).

### Decision D — One global Settings home, showing only what your role allows

Today "settings" are scattered across three pages (Account, Options, Lists). We merge
them into a single **Settings** area reachable from anywhere, with sections that
appear based on your access:
- **Account** and **Appearance** — everyone (it's your own account and your own theme).
- **Finance settings** (VAT rates, Categories) — only finance users.
- **Business settings** (Lead statuses) — only CRM users.
- **Users** (admin) — only the super admin.

### Decision E — Invites use a privileged key, walled off on the server

Adding users by email needs Supabase's admin powers, which use the **service-role
key** you already added. That key is dangerous (it can read/write everything), so it
lives only in a single server-side file that never reaches the browser, and is used
only by the invite/admin code.

### Decision F — Build in a safe order, app working at every step

Each phase leaves the app fully working. We put the invisible foundations in first
(you won't see a difference), then flip data to shared, then restructure the screens,
then build the CRM, and finally turn on user management. The one piece that depends on
things only *you* can do (the Vercel key, closing public signup) comes last.

---

## Part 3 — The phases

Five phases. Each has a short "what this does" and then plain-language steps.

### Phase 1 — Identity & permission foundations (you won't see any change)

**What this does:** Puts the profile/permission machinery in place under the hood and
makes your account the super admin with full access. The app looks and behaves exactly
as it does now, because you still have access to everything.

Steps:
1. Create a **profiles** table — one record per user — with the access switches
   (admin, finance, CRM, active) and the display name.
2. Add small **permission-check helpers** in the database (e.g. "does the current
   user have finance access?") that the security rules and the app will both use.
3. Add an automatic rule so that **every new user gets a profile** the moment their
   account is created (starting with no access until the admin grants it).
4. Create **your** profile: admin on, finance on, CRM on, active — and move your
   display name into it.
5. Confirm nothing changed for you: the app still works end to end.

### Phase 2 — Turn the finance data into shared company data

**What this does:** Changes the database rules so finance data is shared among
everyone with finance access, instead of being locked to your account. Because you're
currently the only user (with finance access), you'll see no difference — but the data
is now correctly company-wide.

Steps:
1. Rewrite each finance table's security rules from "only the owner" to "anyone with
   finance access," while still recording who created each row.
2. Re-check the two behind-the-scenes database views (the transactions list and wallet
   balances) so they follow the new shared rules correctly.
3. Run Supabase's security and performance checks to confirm nothing is exposed
   incorrectly and the rules are efficient.
4. Verify: your data all still appears, adds/edits/deletes still work.

### Phase 3 — Areas, role-aware menus, and the unified Settings

**What this does:** Reorganizes the screens into the Finance and Business areas with a
switcher, and merges Account/Options/Lists into one global Settings. This is the big
visual restructure. Since you have all access, you'll see everything — just arranged
the new way.

Steps:
1. Add an **area switcher** to the top bar (Finance / Business), showing only the
   areas you're allowed into, and clearly indicating which one you're in.
2. Make the **side menu adapt** to the area you're in (and hide anything your role
   can't access).
3. Turn the home page into a simple **launcher** that always shows the areas you can
   access and lets you enter one — it never skips itself, even if you only have access
   to a single area.
4. Build the **Settings** area (Account, Appearance, Finance settings, and later
   Business settings), each section shown only to those allowed — and move today's
   Account/Options/Lists pages into it, keeping the old links working via redirects.
5. Enforce access at the screen level: someone without finance access who tries to
   open a finance page is sent away politely.
6. Verify every existing page still works from its new home.

### Phase 4 — The Business area: the CRM (Leads)

**What this does:** Builds the actual CRM inside the Business area — leads with their
details, a running log of actions taken, and a configurable list of communication
statuses. Fully usable by you immediately.

Steps:
1. Create the **leads** data (name, phone, email, their needs, project description,
   status) and a **lead-activity log** (dated, free-text entries recording who did
   what and the next step), both shared among CRM users.
2. Add a **Lead statuses** lookup list you can edit in Business settings (so you
   define the stages — e.g. New, Contacted, Follow-up, Proposal — yourself).
3. Build the **Leads list** screen (search, filter, sort — using the app's standard
   table style so it matches everything else).
4. Build the **Lead detail** screen: view/edit the lead's info, change its status, and
   add activity-log entries that show newest-first with who and when.
5. Wire the Business area's menu and home to the new CRM.
6. Verify the whole add-lead / log-actions / change-status flow.

### Phase 5 — User management & invitations (uses the service-role key)

**What this does:** Lets you, as admin, add and manage people. This is last because it
depends on the key being live on Vercel and on closing public signup — the pieces that
need your dashboard actions.

Steps:
1. Add the **admin Users screen**: see all users and their access, add a new user by
   email with the access switches you choose, change anyone's access later, and
   turn a user off.
2. Build the **invite flow**: sending the invite email, and the **set-your-password**
   page the invited person lands on from the email link.
3. **Change your login email** to `a.pappas@yoltlabs.com` (afterwards you log in with
   that).
4. **Close public signup** so only invited people can join (this includes a small
   Supabase dashboard switch — I'll give you the exact step).
5. Give you a **branded, plain invite email** (no Yolt Labs company branding — sent
   from Supabase's default sender, or your own mailbox later if you prefer).
6. Test the full loop with a throwaway test address before you invite real people.

**Your prerequisites for this phase** (status):
- ✅ `SUPABASE_SERVICE_ROLE_KEY` added to **Vercel** (Production + Preview) — done on your end.
- ✅ Supabase Auth **URL settings** (Site URL + redirect URLs) — done on your end.
- The Supabase dashboard switch to **disable public signups** — handled as part of
  closing signup in this phase (confirmed at build time).

Note: I can't read Vercel env vars or Supabase Auth config from my tools (both are
dashboard-only, and env values are secret by design), so those two rely on your
confirmation — they get exercised for real when the invite flow runs in this phase,
where any misconfiguration surfaces as a clear error. What I *did* verify: the
service-role key value is valid (it authenticates against the admin API) and the
Supabase project is healthy.

---

## Part 4 — Technical reference (implementer notes)

Working notes for building the above. Not required reading for the non-developer.

### 4.1 Permission model — profiles + SECURITY DEFINER helpers (NOT JWT claims)

Chosen over the custom-access-token-hook / `user_roles` + `role_permissions` pattern
(Supabase's RBAC guide) deliberately: JWT-baked claims go stale on permission change
(no invalidation until refresh), and a full permissions matrix is overkill for three
booleans. A profiles row read via a `STABLE SECURITY DEFINER` helper, wrapped in
`(select …)` in policies, evaluates once per query as an InitPlan — same performance
shape as the existing `(select auth.uid())` policies the perf advisor already wants —
and applies changes immediately.

```
public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,                 -- denormalized for admin listing convenience
  full_name     text,
  is_admin      boolean not null default false,
  can_access_finance boolean not null default false,
  can_access_crm     boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
)
```

Helpers (all `security definer`, `set search_path = ''`, `stable`, `language sql`),
which bypass RLS internally to avoid the classic self-referential-policy recursion:

```
public.current_profile()      -> row for auth.uid()
public.is_active_user()       -> bool
public.has_finance_access()   -> is_active and can_access_finance
public.has_crm_access()       -> is_active and can_access_crm
public.is_admin()             -> is_active and is_admin
```

- **Recursion guard:** helpers are SECURITY DEFINER so reading `profiles` inside them
  does not re-trigger `profiles`' own RLS. Profiles' RLS then safely uses `is_admin()`
  without infinite recursion.
- Grant EXECUTE to `authenticated`.

**profiles RLS:**
- SELECT: `(select auth.uid()) = id OR (select public.is_admin())`.
- UPDATE/INSERT: admin only — `(select public.is_admin())`. (Invites write via the
  service-role client, which bypasses RLS anyway; in-app admin edits go through this.)
- No self-service writes to the access switches (a user must not grant themselves
  access). A user editing *their own display name* goes through a narrow, dedicated
  path that can't touch the flags (server action validates), or admin-only + display
  name stays in a separate updatable manner — simplest: display-name update is a
  server action that only writes `full_name` for `auth.uid()`; keep flags out of any
  user-facing update.

**Auto-provision trigger:** `on auth.users` after insert → insert a bare
`profiles` row (all access false, active true, email + full_name from the new user).
Standard `handle_new_user()` SECURITY DEFINER trigger pattern.

### 4.2 Converting finance tables to shared data

Tables: `transactions`, `transaction_vat_lines`, `entities`, `wallets`, `vat_rates`,
`categories`. Current policies (19 total) are all `(select auth.uid()) = user_id`.

Replace the **SELECT/UPDATE `USING`** and **INSERT/UPDATE `WITH CHECK`** with
`(select public.has_finance_access())`. Keep `user_id` column + its
`default auth.uid()` so authorship is still recorded on insert; it just stops gating
visibility.

- Preserve the soft-delete RLS gotcha (Summary/memory): SELECT policy must NOT filter
  `is_deleted` (else you can't set `is_deleted = true`). The finance-access gate has
  the same property, so keep `is_deleted` filtering only in the app-layer
  `getActive*` helpers — unchanged.
- `transaction_vat_lines` keeps its (unusual) real DELETE policy — regate it on
  `has_finance_access()` too.
- Views `transactions_expanded` and `wallet_balances` are `security_invoker = true`,
  so they inherit the new base-table policies automatically. **Re-run the security
  advisor** after the migration to confirm no leak and no `security_invoker` regression.
- Existing 856 rows need **no data change** — they already carry a valid `user_id`
  (yours); they simply become visible to all finance users.
- Rewrite every new policy in `(select …)` InitPlan form so the perf advisor stays
  clean (memory: `auth_rls_initplan`).

### 4.3 App-layer permission reads & route protection

- Extend `getCurrentUser()` (`src/lib/user.ts`) — or add `getProfile()` — to fetch the
  profiles row once (id, name, email, is_admin, can_access_finance, can_access_crm,
  is_active). This becomes the single source for nav gating and layout guards.
- **Keep `proxy.ts` auth-only** (it already avoids a DB hit, using `getClaims()`).
  Do **not** add a per-request profile fetch there. Enforce area access in each
  **area layout** (server component), which is already fetching server-side: a
  finance layout redirects users without `can_access_finance`; a business layout
  redirects users without `can_access_crm`; admin pages redirect non-admins. Same for
  the settings sections (render per-flag).
- Inactive users (`is_active = false`): block at the app shell / login → sign out with
  a message. Cheap check in the top-level `(app)` layout.

### 4.4 Route / folder organization (feature-driven, flat URLs)

Reorganize `src/app/(app)/` into **route groups** (parenthesized → no URL segment) so
each area gets its own layout + side nav without changing any URL:

```
src/app/(app)/
  (finance)/        -> transactions, entities, wallets, taxes  (URLs unchanged)
    layout.tsx      -> finance guard + finance side nav
  (business)/       -> leads, ...                              (new URLs)
    layout.tsx      -> crm guard + business side nav
  (settings)/       -> account, appearance, finance lists, business lists, users
    layout.tsx      -> settings shell (sections gated per flag)
  layout.tsx        -> top bar (with area switcher) + active-area detection
  page.tsx          -> launcher / home
```

- Moving existing route folders into `(finance)/` does not change their paths (route
  groups are URL-invisible). Verify the `wallets/[id]` redirect and Taxes→Transactions
  links still resolve.
- Old settings URLs (`/account`, `/options`, `/lists/*`) → keep as thin redirects into
  the new `/settings/*` locations so nothing external breaks. Update internal `Link`s
  and every `revalidatePath('/lists')` / `'/options'` accordingly (grep first).
- Active-area detection: derive from pathname prefix (transactions/entities/wallets/
  taxes → Finance; leads → Business). Settings & Users are area-neutral (top-bar/menu).
- `lists-groups.ts` already anticipates growth ("Projects group", "Tax & Payroll
  group") — extend it, and split its consumption so finance groups render under
  Finance settings and CRM groups under Business settings, gated by flag.

### 4.5 CRM schema

```
public.lead_statuses (   -- editable lookup list, same shape as categories/vat_rates
  id, user_id default auth.uid(), name, position smallint,
  created_at, is_deleted, deleted_at )

public.leads (
  id, user_id default auth.uid(),         -- created_by audit
  name text not null,
  phone text, email text,
  needs text,                             -- their description of what they need
  description text,                       -- our summary of the project
  status_id uuid references lead_statuses(id) on delete set null,
  created_at, is_deleted, deleted_at )

public.lead_activities (
  id, user_id default auth.uid(),         -- who logged it
  lead_id uuid references leads(id) on delete cascade,
  body text not null,                     -- free-text: what happened / next step
  created_at,
  is_deleted, deleted_at )                -- soft-delete to match app convention
```

- RLS on all three: gate on `public.has_crm_access()` (SELECT/INSERT/UPDATE; DELETE
  only where the app soft-deletes — i.e. none, use `is_deleted`).
- Follow every existing app convention: soft-delete via `getActive*` helper, shared
  table template for the Leads list, `ModalShell`/`useDialog` for add/edit, zod schema
  + `parseOrThrow` in server actions, `(select …)` InitPlan policies, partial indexes
  `where is_deleted = false` on `leads(user_id)`, `lead_activities(lead_id)`,
  `leads(status_id)`.
- Statuses list = new `/settings/.../lead-statuses`, registered as a **Business**
  group in the lists structure.
- Activity log UI: append box + newest-first list; each entry shows author
  (`profiles.full_name`) + `formatDate`/time. "Who" comes from joining `user_id` →
  profiles.
- Lead detail page: dedicated route `/leads/[id]` (not a modal) since it hosts the
  activity log; the list rows link into it. (Deviation from the "row-click opens edit
  modal" pattern — justified by the activity log needing a full page; note it in
  Summary when built.)
- Regenerate `database.types.ts` after each migration; use `TypedSupabaseClient`
  everywhere; remember `numeric`→string runtime gotcha (not many numerics here).

### 4.6 Admin & invite flow

- `src/lib/supabase/admin.ts` — a server-only factory using
  `process.env.SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL`,
  `createClient(url, serviceKey, { auth: { autoRefreshToken:false, persistSession:false }})`.
  Never imported by any client component. Guard: throw if the env var is missing.
- **Invite:** `supabase.auth.admin.inviteUserByEmail(email, { redirectTo })` where
  `redirectTo = ${SITE_URL}/auth/confirm?next=/set-password`. Then upsert the invitee's
  `profiles` row with the admin-chosen flags (service-role bypasses RLS). The auto
  trigger will have created a bare row; the invite action sets the flags.
- **Acceptance:** invite email link → Supabase verify → redirect to
  `/auth/confirm` (existing route handles `verifyOtp`, `type=invite`) → forward to a
  new **`/set-password`** page. At that point the invitee has a session but no
  password; page calls `supabase.auth.updateUser({ password })`, then routes into the
  app. (Redirect URLs already allow-listed with `/**`.)
- **Users page** (admin): list via `admin.listUsers()` joined with `profiles`; toggle
  flags (writes to profiles); "resend invite"; set `is_active`. All behind an
  `is_admin()` guard in the settings/admin layout.
- **Email change (yours):** `admin.updateUserById(id, { email:'a.pappas@yoltlabs.com',
  email_confirm:true })` — pre-confirmed, no round-trip. Note the session/JWT will show
  the new email after refresh.
- **Close signup:** remove the `/signup` UI + neuter the `signup` server action, AND
  disable "Allow new users to sign up" in Supabase dashboard (Auth → Providers →
  Email) so the API can't self-register either. Dashboard step for the user in Phase 5.
- **Email template:** customize Supabase "Invite user" template (Auth → Email
  Templates) — plain, "Yolt-App", "Set up your account" CTA, no Yolt Labs branding.
  Built-in sender is fine at ≤4 users; optional personal-mailbox SMTP later.

### 4.7 Existing-code changes needed (audit result)

Found during the current-state review — things to touch beyond the new features:
- `side-nav.tsx` — becomes area-aware (per-area link sets, role-gated). Currently a
  flat `LINKS` array.
- `top-bar.tsx` — gains the area switcher; still no `max-w` wrapper.
- `user-menu.tsx` — "Options" link → "Settings"; add "Users" for admins; reads name
  from profiles.
- `(app)/layout.tsx` — reads profile (not just name/email); inactive-user guard;
  provides area context.
- `lib/user.ts` — extend to include profile flags (or add `getProfile`).
- Every `*/actions.ts` insert relies on `user_id default auth.uid()` — keep, but the
  shared-RLS switch means inserts now succeed for any finance user (intended).
- `signup/page.tsx` + `auth/actions.ts` `signup` — remove/close (Phase 5).
- `lists-groups.ts` — split into finance vs business groups, consumed per-flag.
- All `revalidatePath('/options' | '/account' | '/lists' | ...)` — update to new
  settings paths (grep before moving).
- Display name currently in `auth user_metadata.full_name` — migrate the single
  existing value into `profiles.full_name`; `getCurrentUser` stops reading metadata.

### 4.8 Resolved decisions (confirmed with the user)

- **Login landing:** always a launcher home showing the areas you can access; it
  **never** auto-enters, even when you have access to only one area.
- **Old settings URLs:** kept as redirects into the new `/settings/*` paths (no hard
  breaks for existing links/bookmarks).
- **Disable user:** included — an `is_active` switch deactivates a user without
  deleting them.
- **Lead status:** one current stage per lead (not multi-tag).

### 4.9 Research sources

- Supabase — Custom Claims & RBAC:
  https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- Makerkit — Permissions & Roles (Next.js + Supabase):
  https://makerkit.dev/docs/next-supabase-turbo/development/permissions-and-roles
- Next.js large-app structure (feature-driven, route groups):
  https://dev.to/addwebsolutionpvtltd/architecting-large-scale-nextjs-applications-folder-structure-patterns-best-practices-2dpj
- Multi-role B2B UX (role-based nav, switchers):
  https://dardesign.io/blog/multi-role-b2b-saas-ux-roles-permissions-flows
- Cross-product navigation UX (app-switcher pattern):
  https://blog.logrocket.com/ux-design/cross-product-navigation-ux
- CRM schema design (leads + activity log audit trail):
  https://www.integrate.io/blog/complete-guide-to-database-schema-design-guide/
