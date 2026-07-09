"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import type { WalletLedgerSortDir, WalletLedgerSortKey } from "../queries";

const DEFAULT_SORT: WalletLedgerSortKey = "date";
const DEFAULT_DIR: WalletLedgerSortDir = "asc";

export function WalletLedgerTableHeader() {
  const { searchParams, setFilterParams } = useListParams();

  const currentSort =
    (searchParams.get("sort") as WalletLedgerSortKey) || DEFAULT_SORT;
  const currentDir: WalletLedgerSortDir =
    searchParams.get("dir") === "desc" ? "desc" : DEFAULT_DIR;

  function handleSort(key: WalletLedgerSortKey) {
    if (currentSort === key) {
      setFilterParams({ sort: key, dir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      setFilterParams({ sort: key, dir: "asc" });
    }
  }

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <SortableHeaderCell
            label="Date"
            sortKey="date"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className={thClass}>
          <SortableHeaderCell
            label="Description"
            sortKey="description"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Type"
              sortKey="type"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderFilterPopover
              label="types"
              value={searchParams.get("type") ?? ""}
              onChange={(v) => setFilterParams({ type: v || null })}
              options={[
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
                { value: "transfer", label: "Transfer" },
              ]}
            />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <SortableHeaderCell
            label="Amount"
            sortKey="amount"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className={`${thClass} text-right`}>
          <SortableHeaderCell
            label="Balance"
            sortKey="balance"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
      </tr>
    </thead>
  );
}
