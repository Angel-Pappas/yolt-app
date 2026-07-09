"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { useListParams } from "@/components/table/use-list-params";
import type { EntitySortDir, EntitySortKey } from "./queries";

const DEFAULT_SORT: EntitySortKey = "name";
const DEFAULT_DIR: EntitySortDir = "asc";

export function EntityTableHeader() {
  const { searchParams, setFilterParams } = useListParams();

  const currentSort =
    (searchParams.get("sort") as EntitySortKey) || DEFAULT_SORT;
  const currentDir: EntitySortDir =
    searchParams.get("dir") === "desc" ? "desc" : DEFAULT_DIR;

  function handleSort(key: EntitySortKey) {
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
        <th className={thClass}>
          <SortableHeaderCell
            label="VAT number"
            sortKey="vat_number"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
