"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronIcon } from "@/components/icons";
import { LIST_GROUPS } from "./lists-groups";

/**
 * Grouped, collapsible navigation for the Lists section — same
 * active-link visual language as the app's main `side-nav.tsx`, plus a
 * per-group collapse toggle (local state only; the layout doesn't
 * remount while navigating within /lists/*, so it survives normally for
 * the session without needing URL/localStorage persistence).
 */
export function ListsNav() {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  return (
    <aside className="w-48 shrink-0 border-r border-edge bg-surface p-4">
      <nav className="flex flex-col gap-4">
        {LIST_GROUPS.map((group) => {
          const isCollapsed = collapsedGroups.has(group.label);
          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={!isCollapsed}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-semibold tracking-wider text-ink-faint uppercase transition-colors hover:text-ink"
              >
                {group.label}
                <ChevronIcon
                  className={`h-3.5 w-3.5 transition-transform ${
                    isCollapsed ? "" : "rotate-90"
                  }`}
                />
              </button>
              {!isCollapsed && (
                <div className="mt-1 flex flex-col gap-1">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-accent-soft font-semibold text-accent"
                            : "text-ink-muted hover:bg-canvas hover:text-ink"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
