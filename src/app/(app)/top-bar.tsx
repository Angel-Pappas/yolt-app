import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

/**
 * Deliberately has no max-w/mx-auto wrapper (unlike every page's own
 * content) — that's what lets it span the true screen edges regardless of
 * the content column's width beneath it.
 */
export function TopBar({ name, email }: { name: string | undefined; email: string }) {
  return (
    <header className="w-full border-b border-edge bg-surface">
      <div className="flex w-full items-center justify-between px-6 py-3">
        <span className="font-display text-lg font-bold text-ink">Yolt-App</span>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <UserMenu name={name} email={email} />
        </div>
      </div>
    </header>
  );
}
