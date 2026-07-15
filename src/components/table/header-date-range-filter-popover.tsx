"use client";

import { useListParams } from "./use-list-params";
import { FilterPopoverShell } from "./filter-popover-shell";

/**
 * A from/to date-range column filter for a Date header. Deliberately bound
 * to the same `from`/`to` params as the page's own DateRangeFilter toolbar
 * (Transactions, the wallet ledger) — another entry point onto the same
 * filter, not a second one that could disagree with it.
 */
const dateInputClass =
  "rounded-md border border-edge bg-surface px-2 py-1.5 text-sm font-normal tracking-normal normal-case text-ink [color-scheme:light] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function HeaderDateRangeFilterPopover({
  minParamKey = "from",
  maxParamKey = "to",
}: {
  minParamKey?: string;
  maxParamKey?: string;
}) {
  const { searchParams, setFilterParams } = useListParams();
  const from = searchParams.get(minParamKey) ?? "";
  const to = searchParams.get(maxParamKey) ?? "";

  return (
    <FilterPopoverShell label="date" active={from !== "" || to !== ""}>
      {() => (
        <div className="flex items-center gap-1.5 p-2">
          <input
            type="date"
            value={from}
            aria-label="From date"
            onChange={(e) => setFilterParams({ [minParamKey]: e.target.value || null })}
            className={dateInputClass}
          />
          <span className="text-xs text-ink-faint">–</span>
          <input
            type="date"
            value={to}
            aria-label="To date"
            onChange={(e) => setFilterParams({ [maxParamKey]: e.target.value || null })}
            className={dateInputClass}
          />
        </div>
      )}
    </FilterPopoverShell>
  );
}
