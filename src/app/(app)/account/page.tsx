import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user";
import { updateDisplayName, updateEmail, updatePassword } from "./actions";

const inputClass =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const primaryBtnClass =
  "inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px";
const cardClass =
  "space-y-4 rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)]";
const sectionTitleClass = "font-display text-lg font-semibold text-ink";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { name, email } = await getCurrentUser(supabase);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-3xl font-bold text-ink">Account</h1>

      {message && (
        <p className="rounded-lg border border-edge bg-accent-soft px-4 py-2.5 text-sm text-ink">
          {message}
        </p>
      )}

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Profile</h2>
        <form action={updateDisplayName} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="name" className="mb-1 block text-sm text-ink-muted">
              Display name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={80}
              defaultValue={name ?? ""}
              className={inputClass}
            />
          </div>
          <button type="submit" className={primaryBtnClass}>
            Save name
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Email</h2>
        <p className="text-sm text-ink-muted">Current: {email}</p>
        <form action={updateEmail} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="email" className="mb-1 block text-sm text-ink-muted">
              New email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={email}
              className={inputClass}
            />
          </div>
          <button type="submit" className={primaryBtnClass}>
            Update email
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Password</h2>
        <form action={updatePassword} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-ink-muted"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <div className="min-w-48 flex-1">
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm text-ink-muted"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <button type="submit" className={primaryBtnClass}>
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
