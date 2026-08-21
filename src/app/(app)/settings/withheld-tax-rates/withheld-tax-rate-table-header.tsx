"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { HeaderNumberRangeFilterPopover } from "@/components/table/header-number-range-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { WITHHELD_TAX_RATE_SORT_KEYS, type WithheldTaxRateSortKey } from "./withheld-tax-rate-queries";

export function WithheldTaxRateTableHeader() {
  const { currentSort, currentDir, handleSort } =
    useSortState<WithheldTaxRateSortKey>(WITHHELD_TAX_RATE_SORT_KEYS);
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
            label="Rate"
            sortKey="rate"
            align="right"
            {...sort}
            filter={
              <HeaderNumberRangeFilterPopover
                label="rate"
                minParamKey="rate_min"
                maxParamKey="rate_max"
              />
            }
          />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
