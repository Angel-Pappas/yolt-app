"use client";

import type { ReactNode } from "react";
import { SearchBox } from "./search-box";
import { DateRangeFilter } from "./date-range-filter";
import { ClearFiltersLink } from "./clear-filters-link";
import { useListParams } from "./use-list-params";

/**
 * The title/search/date-range/Add-button block shared by every standalone
 * list page (Transactions, Entities, Wallets). Two rows:
 *   1. Title + subtitle on the left; search box (if this page has one) +
 *      Add button on the right — search box sits next to Add, not in its
 *      own row below, per explicit user direction.
 *   2. Date range (if this page has one), on its own row below — combining
 *      it into row 1 alongside search + Add made that row too wide and
 *      wrapped the Add button onto an orphan third line.
 * Single place that decides this arrangement, so repositioning it again
 * later is a one-file change.
 *
 * Not used by the wallet transaction history page — that page has no Add
 * button (transactions are added from the Transactions page) and has a
 * back link + balance figure instead, structurally different enough that
 * forcing it through this component would be an awkward fit. It composes
 * the same SearchBox/DateRangeFilter/ClearFiltersLink pieces directly
 * instead — see wallets/[id]/page.tsx.
 */
export function ListPageHeader({
  title,
  subtitle,
  searchPlaceholder,
  showDateRange = false,
  addButton,
}: {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  showDateRange?: boolean;
  addButton: ReactNode;
}) {
  const { searchParams, clearAll } = useListParams();
  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {searchPlaceholder && <SearchBox placeholder={searchPlaceholder} />}
          {!showDateRange && hasFilters && <ClearFiltersLink onClick={clearAll} />}
          {addButton}
        </div>
      </div>
      {showDateRange && (
        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangeFilter />
          {hasFilters && <ClearFiltersLink onClick={clearAll} />}
        </div>
      )}
    </div>
  );
}
