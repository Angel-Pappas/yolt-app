import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user";
import {
  formInputClass,
  formLabelClass,
  formPrimaryButtonClass,
} from "@/components/form-styles";
import { updateDisplayName, updateEmail, updatePassword } from "./actions";

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
    <div className="flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
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
            <label htmlFor="name" className={formLabelClass}>
              Display name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={80}
              defaultValue={name ?? ""}
              className={formInputClass}
            />
          </div>
          <button type="submit" className={formPrimaryButtonClass}>
            Save name
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Email</h2>
        <p className="text-sm text-ink-muted">Current: {email}</p>
        <form action={updateEmail} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="email" className={formLabelClass}>
              New email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={email}
              className={formInputClass}
            />
          </div>
          <button type="submit" className={formPrimaryButtonClass}>
            Update email
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Password</h2>
        <form action={updatePassword} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="password" className={formLabelClass}>
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className={formInputClass}
            />
          </div>
          <div className="min-w-48 flex-1">
            <label htmlFor="confirmPassword" className={formLabelClass}>
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className={formInputClass}
            />
          </div>
          <button type="submit" className={formPrimaryButtonClass}>
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
