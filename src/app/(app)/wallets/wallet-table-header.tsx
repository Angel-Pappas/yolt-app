"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { useListParams } from "@/components/table/use-list-params";
import type { WalletSortDir, WalletSortKey } from "./queries";

const DEFAULT_SORT: WalletSortKey = "name";
const DEFAULT_DIR: WalletSortDir = "asc";

export function WalletTableHeader() {
  const { searchParams, setFilterParams } = useListParams();

  const currentSort =
    (searchParams.get("sort") as WalletSortKey) || DEFAULT_SORT;
  const currentDir: WalletSortDir =
    searchParams.get("dir") === "desc" ? "desc" : DEFAULT_DIR;

  function handleSort(key: WalletSortKey) {
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
            label="Balance"
            sortKey="balance"
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
