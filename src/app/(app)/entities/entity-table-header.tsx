"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { ENTITY_SORT_KEYS, type EntitySortKey } from "./queries";

export function EntityTableHeader() {
  const { currentSort, currentDir, handleSort } = useSortState<EntitySortKey>(ENTITY_SORT_KEYS);

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
              label="VAT number"
              sortKey="vat_number"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderTextFilterPopover label="VAT number" paramKey="q" />
          </div>
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
