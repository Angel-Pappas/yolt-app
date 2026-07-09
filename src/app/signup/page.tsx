import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { formInputClass, formLabelClass } from "@/components/form-styles";

export default async function SignupPage({
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
        <form className="space-y-4 rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-card)]">
          <h1 className="font-display text-lg font-semibold text-ink">Sign up</h1>
          <div>
            <label htmlFor="email" className={formLabelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={formInputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={formLabelClass}>
              Password
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
          {message && (
            <p className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
              {message}
            </p>
          )}
          <button
            formAction={signup}
            className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px"
          >
            Sign up
          </button>
          <p className="text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-ink underline decoration-edge-strong underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
