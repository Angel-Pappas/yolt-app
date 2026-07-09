"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { useListParams } from "@/components/table/use-list-params";
import type { VatRateSortDir, VatRateSortKey } from "./vat-rate-queries";

const DEFAULT_SORT: VatRateSortKey = "rate";
const DEFAULT_DIR: VatRateSortDir = "asc";

export function VatRateTableHeader() {
  const { searchParams, setFilterParams } = useListParams();

  const currentSort =
    (searchParams.get("sort") as VatRateSortKey) || DEFAULT_SORT;
  const currentDir: VatRateSortDir =
    searchParams.get("dir") === "desc" ? "desc" : DEFAULT_DIR;

  function handleSort(key: VatRateSortKey) {
    if (currentSort === key) {
      setFilterParams({ sort: key, dir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      setFilterParams({ sort: key, dir: "asc" });
    }
  }

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <SortableHeaderCell
            label="Name"
            sortKey="name"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className={`${thClass} text-right`}>
          <SortableHeaderCell
            label="Rate"
            sortKey="rate"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
