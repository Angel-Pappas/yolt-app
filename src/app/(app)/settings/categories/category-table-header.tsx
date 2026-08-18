"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import { useSortState } from "@/components/table/use-sort-state";
import { CATEGORY_SORT_KEYS, type CategorySortKey } from "./queries";

export function CategoryTableHeader() {
  const { searchParams, setFilterParams } = useListParams();
  const { currentSort, currentDir, handleSort } = useSortState<CategorySortKey>(CATEGORY_SORT_KEYS);
  const sort = { currentSort, currentDir, onSort: handleSort };

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <TableHeaderCell
            label="Name"
            sortKey="name"
            {...sort}
            filter={<HeaderTextFilterPopover label="name" paramKey="q" />}
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Type"
            sortKey="type"
            {...sort}
            filter={
              <HeaderFilterPopover
                label="types"
                value={searchParams.get("type") ?? ""}
                onChange={(v) => setFilterParams({ type: v || null })}
                options={[
                  { value: "income", label: "Income" },
                  { value: "expense", label: "Expense" },
                ]}
              />
            }
          />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
