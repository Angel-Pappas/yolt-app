"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderDateRangeFilterPopover } from "@/components/table/header-date-range-filter-popover";
import { HeaderNumberRangeFilterPopover } from "@/components/table/header-number-range-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { MONTHLY_VAT_SORT_KEYS, type MonthlyVatSortKey } from "../queries";

/** The six money columns, all the same shape — label, sort key, and which pair of range params back the filter. */
const MONEY_COLUMNS: {
  label: string;
  sortKey: MonthlyVatSortKey;
  filterLabel: string;
  minParamKey: string;
  maxParamKey: string;
}[] = [
  {
    label: "Income VAT",
    sortKey: "outputVat",
    filterLabel: "income VAT",
    minParamKey: "income_vat_min",
    maxParamKey: "income_vat_max",
  },
  {
    label: "Expenses VAT",
    sortKey: "inputVat",
    filterLabel: "expenses VAT",
    minParamKey: "expense_vat_min",
    maxParamKey: "expense_vat_max",
  },
  {
    label: "Net VAT",
    sortKey: "net",
    filterLabel: "net VAT",
    minParamKey: "net_min",
    maxParamKey: "net_max",
  },
  {
    label: "Roll over",
    sortKey: "rolloverIn",
    filterLabel: "roll over",
    minParamKey: "rollover_min",
    maxParamKey: "rollover_max",
  },
  {
    label: "Payable this month",
    sortKey: "payableThisMonth",
    filterLabel: "payable this month",
    minParamKey: "payable_this_min",
    maxParamKey: "payable_this_max",
  },
  {
    label: "Payable next month",
    sortKey: "payableNextMonth",
    filterLabel: "payable next month",
    minParamKey: "payable_next_min",
    maxParamKey: "payable_next_max",
  },
];

/**
 * Sorting by anything other than Month will make Roll over/Payable
 * this-next month stop reading as a coherent chain (each row depends on
 * the one before it) — same accepted tradeoff the old wallet ledger's
 * running-balance column already had, not special-cased away here either.
 */
export function VatTableHeader() {
  const { currentSort, currentDir, handleSort } =
    useSortState<MonthlyVatSortKey>(MONTHLY_VAT_SORT_KEYS);
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
