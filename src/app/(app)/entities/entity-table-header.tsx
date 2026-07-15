"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { ENTITY_SORT_KEYS, type EntitySortKey } from "./queries";

export function EntityTableHeader() {
  const { currentSort, currentDir, handleSort } = useSortState<EntitySortKey>(ENTITY_SORT_KEYS);
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
            label="VAT number"
            sortKey="vat_number"
            {...sort}
            filter={<HeaderTextFilterPopover label="VAT number" paramKey="q" />}
          />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
