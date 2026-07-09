"use client";

import { SearchBox } from "@/components/table/search-box";
import { DateRangeFilter } from "@/components/table/date-range-filter";
import { ClearFiltersLink } from "@/components/table/clear-filters-link";
import { useListParams } from "@/components/table/use-list-params";

export function WalletLedgerFiltersBar() {
  const { searchParams, clearAll } = useListParams();
  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <SearchBox placeholder="Search description…" />
      <div className="flex flex-wrap items-center gap-2.5">
        <DateRangeFilter />
        {hasFilters && <ClearFiltersLink onClick={clearAll} />}
      </div>
    </div>
  );
}
