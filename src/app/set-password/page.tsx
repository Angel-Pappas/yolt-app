import { setPassword } from "./actions";
import { formInputClass, formLabelClass } from "@/components/form-styles";

/**
 * Where an invited user lands from their email link (after /auth/confirm
 * verifies the invite and establishes their session). They set a password here,
 * then continue into the app. Standalone — no app shell.
 */
export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm space-y-6">
        <span className="block text-center font-display text-2xl font-bold text-ink">
          Yolt-App
        </span>
        <form
          action={setPassword}
          className="space-y-4 rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-card)]"
        >
          <h1 className="font-display text-lg font-semibold text-ink">
            Set your password
          </h1>
          <p className="text-sm text-ink-muted">
            Choose a password to finish setting up your account.
          </p>

          {message && (
            <p className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
              {message}
            </p>
          )}

          <div>
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

          <div>
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

          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110"
          >
            Set password &amp; continue
          </button>
        </form>
      </div>
    </div>
  );
}
