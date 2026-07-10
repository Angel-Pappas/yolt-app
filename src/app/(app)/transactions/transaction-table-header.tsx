"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { HeaderNumberRangeFilterPopover } from "@/components/table/header-number-range-filter-popover";
import { HeaderDateRangeFilterPopover } from "@/components/table/header-date-range-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import { useSortState } from "@/components/table/use-sort-state";
import type { Entity } from "../entities/queries";
import type { Category } from "../lists/categories/queries";
import type { Wallet } from "../wallets/queries";
import { SORT_KEYS, type SortKey } from "./queries";

export function TransactionTableHeader({
  entities,
  categories,
  wallets,
}: {
  entities: Entity[];
  categories: Category[];
  wallets: Wallet[];
}) {
  const { searchParams, setFilterParams } = useListParams();
  const { currentSort, currentDir, handleSort } = useSortState<SortKey>(SORT_KEYS);

  return (
    <thead>
      <tr className={tableHeadRowClass}>
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
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Date"
              sortKey="date"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderDateRangeFilterPopover />
          </div>
        </th>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Wallet"
              sortKey="wallet"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderFilterPopover
              label="wallets"
              value={searchParams.get("wallet") ?? ""}
              onChange={(v) => setFilterParams({ wallet: v || null })}
              options={wallets.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>
        </th>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Category"
              sortKey="category"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderFilterPopover
              label="categories"
              value={searchParams.get("category") ?? ""}
              onChange={(v) => setFilterParams({ category: v || null })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        </th>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Entity"
              sortKey="entity"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderFilterPopover
              label="entities"
              value={searchParams.get("entity") ?? ""}
              onChange={(v) => setFilterParams({ entity: v || null })}
              options={entities.map((e) => ({ value: e.id, label: e.name }))}
            />
          </div>
        </th>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortableHeaderCell
              label="Description"
              sortKey="description"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <HeaderTextFilterPopover label="description" paramKey="q" />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderNumberRangeFilterPopover
              label="net"
              minParamKey="net_min"
              maxParamKey="net_max"
              align="right"
            />
            <SortableHeaderCell
              label="Net"
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
              label="VAT"
              minParamKey="vat_amount_min"
              maxParamKey="vat_amount_max"
              align="right"
            />
            <SortableHeaderCell
              label="VAT"
              sortKey="vat_amount"
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
              label="total"
              minParamKey="total_min"
              maxParamKey="total_max"
              align="right"
            />
            <SortableHeaderCell
              label="Total"
              sortKey="total"
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
