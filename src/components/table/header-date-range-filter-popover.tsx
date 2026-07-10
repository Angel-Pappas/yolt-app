"use client";

import { useListParams } from "./use-list-params";
import { FilterPopoverShell } from "./filter-popover-shell";

/**
 * A from/to date-range column filter for a Date header. Deliberately bound
 * to the same `from`/`to` params as the page's own DateRangeFilter toolbar
 * (Transactions, the wallet ledger) — another entry point onto the same
 * filter, not a second one that could disagree with it.
 */
export function HeaderDateRangeFilterPopover({
  minParamKey = "from",
  maxParamKey = "to",
  align = "left",
}: {
  minParamKey?: string;
  maxParamKey?: string;
  align?: "left" | "right";
}) {
  const { searchParams, setFilterParams } = useListParams();
  const from = searchParams.get(minParamKey) ?? "";
  const to = searchParams.get(maxParamKey) ?? "";

  return (
    <FilterPopoverShell label="date" active={from !== "" || to !== ""} align={align}>
      {() => (
        <div className="flex items-center gap-1.5 p-1.5">
          <input
            type="date"
            value={from}
            onChange={(e) => setFilterParams({ [minParamKey]: e.target.value || null })}
            className="rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-ink [color-scheme:light] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-xs text-ink-faint">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setFilterParams({ [maxParamKey]: e.target.value || null })}
            className="rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-ink [color-scheme:light] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      )}
    </FilterPopoverShell>
  );
}
