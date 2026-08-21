"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderDateRangeFilterPopover } from "@/components/table/header-date-range-filter-popover";
import { HeaderNumberRangeFilterPopover } from "@/components/table/header-number-range-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { MONTHLY_WITHHELD_SORT_KEYS, type MonthlyWithheldSortKey } from "../queries";

/** The two money columns, same shape — label, sort key, and which pair of range params back the filter. */
const MONEY_COLUMNS: {
  label: string;
  sortKey: MonthlyWithheldSortKey;
  filterLabel: string;
  minParamKey: string;
  maxParamKey: string;
}[] = [
  {
    label: "Withheld this month",
    sortKey: "withheld",
    filterLabel: "withheld this month",
    minParamKey: "withheld_min",
    maxParamKey: "withheld_max",
  },
  {
    label: "Payable this month",
    sortKey: "payableThisMonth",
    filterLabel: "payable this month",
    minParamKey: "payable_this_min",
    maxParamKey: "payable_this_max",
  },
];

/**
 * Sorting by anything other than Month makes Payable this month stop reading
 * as a coherent chain (each row's payable is the previous row's withholding)
 * — same accepted tradeoff as the VAT ledger.
 */
export function WithheldTableHeader() {
  const { currentSort, currentDir, handleSort } =
    useSortState<MonthlyWithheldSortKey>(MONTHLY_WITHHELD_SORT_KEYS);
  const sort = { currentSort, currentDir, onSort: handleSort };

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <TableHeaderCell
            label="Month"
            sortKey="period"
            {...sort}
            filter={<HeaderDateRangeFilterPopover />}
          />
        </th>
        {MONEY_COLUMNS.map((col) => (
          <th key={col.sortKey} className={`${thClass} text-right`}>
            <TableHeaderCell
              label={col.label}
              sortKey={col.sortKey}
              align="right"
              {...sort}
              filter={
                <HeaderNumberRangeFilterPopover
                  label={col.filterLabel}
                  minParamKey={col.minParamKey}
                  maxParamKey={col.maxParamKey}
                />
              }
            />
          </th>
        ))}
      </tr>
    </thead>
  );
}
