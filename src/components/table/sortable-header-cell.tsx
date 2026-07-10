"use client";

import { SortIcon } from "@/components/icons";
import type { SortDir } from "./use-sort-state";

/**
 * A clickable, sortable column header label — shared by every table.
 * Generic over the page's own SortKey union (rather than widened to
 * `string`) so a typo'd sort key is a compile error instead of a
 * silently-dead button.
 *
 * The sort arrows are always visible (see SortIcon) rather than only
 * appearing on the active column — `currentSort`/`currentDir` are
 * nullable (see use-sort-state.ts's tri-state cycle: unsorted -> desc ->
 * asc -> unsorted), and a `null` here just means every header renders its
 * icon in the dim "unsorted" state.
 */
export function SortableHeaderCell<TSortKey extends string>({
  label,
  sortKey,
  currentSort,
  currentDir,
  align = "left",
  onSort,
}: {
  label: string;
  sortKey: TSortKey;
  currentSort: TSortKey | null;
  currentDir: SortDir | null;
  align?: "left" | "right";
  onSort: (key: TSortKey) => void;
}) {
  const isActive = currentSort === sortKey;
  const state: "asc" | "desc" | "none" = isActive && currentDir ? currentDir : "none";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 transition-colors hover:text-ink-muted ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <span>{label}</span>
      <SortIcon state={state} className={`h-3 w-3 ${isActive ? "text-accent" : "text-ink-faint"}`} />
    </button>
  );
}
