import Link from "next/link";
import { login } from "@/app/auth/actions";

export default async function LoginPage({
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
          <h1 className="font-display text-lg font-semibold text-ink">Log in</h1>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm text-ink-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm text-ink-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          {message && (
            <p className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
              {message}
            </p>
          )}
          <button
            formAction={login}
            className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px"
          >
            Log in
          </button>
          <p className="text-center text-sm text-ink-muted">
            No account?{" "}
            <Link
              href="/signup"
              className="text-ink underline decoration-edge-strong underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
