import Link from "next/link";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { AreaSwitcher } from "./area-switcher";

/**
 * Deliberately has no max-w/mx-auto wrapper (unlike every page's own
 * content) — that's what lets it span the true screen edges regardless of
 * the content column's width beneath it.
 *
 * The "Yolt-App" wordmark links to the launcher ("/"); the area switcher sits
 * beside it (only the areas the user can access).
 */
export function TopBar({
  name,
  email,
  canAccessFinance,
  canAccessCrm,
}: {
  name: string | undefined;
  email: string;
  canAccessFinance: boolean;
  canAccessCrm: boolean;
}) {
  return (
    <header className="w-full border-b border-edge bg-surface">
      <div className="flex w-full items-center justify-between px-6 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="font-display text-lg font-bold text-ink">
            Yolt-App
          </Link>
          <AreaSwitcher
            canAccessFinance={canAccessFinance}
            canAccessCrm={canAccessCrm}
          />
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <UserMenu name={name} email={email} />
        </div>
      </div>
    </header>
  );
}
