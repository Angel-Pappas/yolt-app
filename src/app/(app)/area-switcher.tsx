"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { AREAS, areaForPath } from "./areas";

/**
 * Top-bar switcher between the areas the user can access (Finance / Business),
 * using the app's segmented-control pattern. The area matching the current path
 * is shown active; clicking an area navigates to its home. Only areas the user
 * can enter are rendered, so a single-area user just sees their one area.
 */
export function AreaSwitcher({
  canAccessFinance,
  canAccessCrm,
}: {
  canAccessFinance: boolean;
  canAccessCrm: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeArea = areaForPath(pathname);

  const areas = AREAS.filter((area) =>
    area.access === "finance" ? canAccessFinance : canAccessCrm
  );

  if (areas.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Area"
      className="inline-flex gap-1 rounded-lg border border-edge bg-canvas p-1"
    >
      {areas.map((area) => {
        const isActive = activeArea === area.id;
        return (
          <button
            key={area.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => router.push(area.home)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-surface-raised text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {area.label}
          </button>
        );
      })}
    </div>
  );
}
