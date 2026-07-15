"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { HeaderNumberRangeFilterPopover } from "@/components/table/header-number-range-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { WALLET_SORT_KEYS, type WalletSortKey } from "./queries";

export function WalletTableHeader() {
  const { currentSort, currentDir, handleSort } = useSortState<WalletSortKey>(WALLET_SORT_KEYS);
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
        <th className={`${thClass} text-right`}>
          <TableHeaderCell
            label="Balance"
            sortKey="balance"
            align="right"
            {...sort}
            filter={
              <HeaderNumberRangeFilterPopover
                label="balance"
                minParamKey="balance_min"
                maxParamKey="balance_max"
              />
            }
          />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
