"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AREAS, areaForPath } from "./areas";

/**
 * The main side nav, now area-aware: it shows the link set of whichever area
 * the current path belongs to (Finance or Business). On area-neutral routes —
 * the launcher "/" and Settings (which has its own sub-nav) — it renders
 * nothing, letting those pages use the full width.
 *
 * The user's access flags are passed in so the nav never shows an area the
 * user can't enter (belt-and-suspenders alongside the per-page guards).
 */
export function SideNav({
  canAccessFinance,
  canAccessCrm,
}: {
  canAccessFinance: boolean;
  canAccessCrm: boolean;
}) {
  const pathname = usePathname();
  const areaId = areaForPath(pathname);
  if (!areaId) return null;

  const allowed =
    (areaId === "finance" && canAccessFinance) ||
    (areaId === "business" && canAccessCrm);
  if (!allowed) return null;

  const area = AREAS.find((a) => a.id === areaId);
  if (!area) return null;

  return (
    <aside className="w-56 shrink-0 border-r border-edge bg-surface p-4">
      <nav className="flex flex-col gap-1">
        {area.links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-soft font-semibold text-accent"
                  : "text-ink-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
