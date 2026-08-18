"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { LEAD_STATUS_SORT_KEYS, type LeadStatusSortKey } from "./queries";

export function LeadStatusTableHeader() {
  const { currentSort, currentDir, handleSort } =
    useSortState<LeadStatusSortKey>(LEAD_STATUS_SORT_KEYS);
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
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
