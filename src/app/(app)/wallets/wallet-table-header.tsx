"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { HeaderNumberRangeFilterPopover } from "@/components/table/header-number-range-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { WALLET_SORT_KEYS, type WalletSortKey } from "./queries";

export function WalletTableHeader() {
  const { currentSort, currentDir, handleSort } = useSortState<WalletSortKey>(WALLET_SORT_KEYS);

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
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderNumberRangeFilterPopover
              label="balance"
              minParamKey="balance_min"
              maxParamKey="balance_max"
              align="right"
            />
            <SortableHeaderCell
              label="Balance"
              sortKey="balance"
              currentSort={currentSort}
              currentDir={currentDir}
              align="right"
              onSort={handleSort}
            />
          </div>
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
