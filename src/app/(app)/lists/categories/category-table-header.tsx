"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import type { CategorySortDir, CategorySortKey } from "./queries";

const DEFAULT_SORT: CategorySortKey = "name";
const DEFAULT_DIR: CategorySortDir = "asc";

export function CategoryTableHeader() {
  const { searchParams, setFilterParams } = useListParams();

  const currentSort =
    (searchParams.get("sort") as CategorySortKey) || DEFAULT_SORT;
  const currentDir: CategorySortDir =
    searchParams.get("dir") === "desc" ? "desc" : DEFAULT_DIR;

  function handleSort(key: CategorySortKey) {
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
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Type"
              sortKey="type"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderFilterPopover
              label="types"
              value={searchParams.get("type") ?? ""}
              onChange={(v) => setFilterParams({ type: v || null })}
              options={[
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
              ]}
            />
          </div>
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
