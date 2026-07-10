"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import { useSortState } from "@/components/table/use-sort-state";
import { CATEGORY_SORT_KEYS, type CategorySortKey } from "./queries";

export function CategoryTableHeader() {
  const { searchParams, setFilterParams } = useListParams();
  const { currentSort, currentDir, handleSort } = useSortState<CategorySortKey>(CATEGORY_SORT_KEYS);

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Name"
              sortKey="name"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderTextFilterPopover label="name" paramKey="q" />
          </div>
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
