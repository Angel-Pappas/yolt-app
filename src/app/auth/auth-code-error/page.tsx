import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm space-y-6">
        <span className="block text-center font-display text-2xl font-bold text-ink">
          Yolt
        </span>
        <div className="space-y-3 rounded-xl border border-edge bg-surface p-6 text-center shadow-[var(--shadow-card)]">
          <h1 className="font-display text-lg font-semibold text-ink">
            Confirmation link invalid
          </h1>
          <p className="text-sm text-ink-muted">
            This link has expired or was already used.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-ink underline decoration-edge-strong underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
