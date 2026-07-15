"use client";

import type { ReactNode } from "react";
import { SortIcon } from "@/components/icons";
import type { SortDir } from "./use-sort-state";

/**
 * One column header, for every table in the app. Owns the *layout* of a
 * header cell so it can't drift from page to page — previously each table
 * hand-assembled its own `<div className="flex …">` around a sort label and
 * a filter, and they disagreed: left-aligned columns put the filter after
 * the title, right-aligned numeric ones put it before, so the funnel
 * visibly swapped sides halfway across the same table.
 *
 * The rule now, in one place:
 *
 *   - The **title is the sort control** — the whole label is the click
 *     target, with the sort arrows immediately after it, so what you read
 *     is what you press.
 *   - The **funnel always sits at the column's trailing edge**, whatever
 *     the column's own alignment. That's the spreadsheet convention, and
 *     it means the filter is always in the same place relative to the
 *     column rather than moving with the data's alignment.
 *
 * `align` still follows the column's data (numeric columns are
 * right-aligned so figures line up), but it only moves the title — the
 * funnel stays put. For a left-aligned column the title sits left and the
 * funnel is pushed to the right edge; for a right-aligned one the title
 * sits next to the funnel, which is already at that edge.
 *
 * Generic over the page's own SortKey union (rather than widened to
 * `string`) so a typo'd sort key is a compile error, not a dead button.
 * `sortKey` may be omitted for a column that has no sort (the title then
 * renders as plain text), and `filter` may be omitted for one that has no
 * filter — the trailing actions column has neither.
 */
export function TableHeaderCell<TSortKey extends string>({
  label,
  sortKey,
  currentSort,
  currentDir,
  align = "left",
  onSort,
  filter,
}: {
  label: string;
  sortKey?: TSortKey;
  currentSort?: TSortKey | null;
  currentDir?: SortDir | null;
  align?: "left" | "right";
  onSort?: (key: TSortKey) => void;
  filter?: ReactNode;
}) {
  const sortable = sortKey !== undefined && onSort !== undefined;
  const isActive = sortable && currentSort === sortKey;
  const state: "asc" | "desc" | "none" = isActive && currentDir ? currentDir : "none";

  return (
    <div
      className={`flex items-center gap-1.5 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          aria-label={`Sort by ${label}`}
          className="flex min-w-0 items-center gap-1 rounded transition-colors hover:text-ink-muted"
        >
          <span className="truncate">{label}</span>
          <SortIcon
            state={state}
            className={`h-3 w-3 shrink-0 ${isActive ? "text-accent" : "text-ink-faint"}`}
          />
        </button>
      ) : (
        <span className="truncate">{label}</span>
      )}

      {filter && (
        // ml-auto only matters for a left-aligned column, where it pushes
        // the funnel from beside the title out to the cell's right edge.
        // A right-aligned column's row is already flush right, so the
        // funnel is the trailing element either way.
        <span className={`shrink-0 ${align === "right" ? "" : "ml-auto"}`}>{filter}</span>
      )}
    </div>
  );
}
