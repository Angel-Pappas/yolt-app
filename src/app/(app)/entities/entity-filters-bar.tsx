"use client";

import { SearchBox } from "@/components/table/search-box";
import { ClearFiltersLink } from "@/components/table/clear-filters-link";
import { useListParams } from "@/components/table/use-list-params";

export function EntityFiltersBar() {
  const { searchParams, clearAll } = useListParams();
  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-edge p-4">
      <SearchBox placeholder="Search name or VAT number…" />
      {hasFilters && <ClearFiltersLink onClick={clearAll} />}
    </div>
  );
}
