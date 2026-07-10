"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { HeaderDateRangeFilterPopover } from "@/components/table/header-date-range-filter-popover";
import { HeaderNumberRangeFilterPopover } from "@/components/table/header-number-range-filter-popover";
import { useSortState } from "@/components/table/use-sort-state";
import { MONTHLY_VAT_SORT_KEYS, type MonthlyVatSortKey } from "../queries";

/**
 * Sorting by anything other than Month will make Roll over/Payable
 * this-next month stop reading as a coherent chain (each row depends on
 * the one before it) — same accepted tradeoff the old wallet ledger's
 * running-balance column already had, not special-cased away here either.
 */
export function VatTableHeader() {
  const { currentSort, currentDir, handleSort } =
    useSortState<MonthlyVatSortKey>(MONTHLY_VAT_SORT_KEYS);

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Month"
              sortKey="period"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderDateRangeFilterPopover />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderNumberRangeFilterPopover
              label="income VAT"
              minParamKey="income_vat_min"
              maxParamKey="income_vat_max"
              align="right"
            />
            <SortableHeaderCell
              label="Income VAT"
              sortKey="outputVat"
              currentSort={currentSort}
              currentDir={currentDir}
              align="right"
              onSort={handleSort}
            />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderNumberRangeFilterPopover
              label="expenses VAT"
              minParamKey="expense_vat_min"
              maxParamKey="expense_vat_max"
              align="right"
            />
            <SortableHeaderCell
              label="Expenses VAT"
              sortKey="inputVat"
              currentSort={currentSort}
              currentDir={currentDir}
              align="right"
              onSort={handleSort}
            />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderNumberRangeFilterPopover
              label="net VAT"
              minParamKey="net_min"
              maxParamKey="net_max"
              align="right"
            />
            <SortableHeaderCell
              label="Net VAT"
              sortKey="net"
              currentSort={currentSort}
              currentDir={currentDir}
              align="right"
              onSort={handleSort}
            />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderNumberRangeFilterPopover
              label="roll over"
              minParamKey="rollover_min"
              maxParamKey="rollover_max"
              align="right"
            />
            <SortableHeaderCell
              label="Roll over"
              sortKey="rolloverIn"
              currentSort={currentSort}
              currentDir={currentDir}
              align="right"
              onSort={handleSort}
            />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderNumberRangeFilterPopover
              label="payable this month"
              minParamKey="payable_this_min"
              maxParamKey="payable_this_max"
              align="right"
            />
            <SortableHeaderCell
              label="Payable this month"
              sortKey="payableThisMonth"
              currentSort={currentSort}
              currentDir={currentDir}
              align="right"
              onSort={handleSort}
            />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderNumberRangeFilterPopover
              label="payable next month"
              minParamKey="payable_next_min"
              maxParamKey="payable_next_max"
              align="right"
            />
            <SortableHeaderCell
              label="Payable next month"
              sortKey="payableNextMonth"
              currentSort={currentSort}
              currentDir={currentDir}
              align="right"
              onSort={handleSort}
            />
          </div>
        </th>
      </tr>
    </thead>
  );
}
