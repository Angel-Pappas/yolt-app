import { logout } from "@/app/auth/actions";
import { NavLinks } from "./nav-links";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="border-b border-edge bg-surface">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <span className="font-display text-lg font-bold text-ink">
              Yolt
            </span>
            <NavLinks />
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
            >
              Log out
            </button>
          </form>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
