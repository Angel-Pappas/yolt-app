"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { TableHeaderCell } from "@/components/table/table-header-cell";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { HeaderTextFilterPopover } from "@/components/table/header-text-filter-popover";
import { HeaderNumberRangeFilterPopover } from "@/components/table/header-number-range-filter-popover";
import { HeaderDateRangeFilterPopover } from "@/components/table/header-date-range-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import { useSortState } from "@/components/table/use-sort-state";
import type { Entity } from "../entities/queries";
import type { Category } from "../lists/categories/queries";
import type { Wallet } from "../wallets/queries";
import { SORT_KEYS, BALANCE_SORT_KEYS, type SortKey } from "./queries";

export function TransactionTableHeader({
  entities,
  categories,
  wallets,
  balanceMode = false,
}: {
  entities: Entity[];
  categories: Category[];
  wallets: Wallet[];
  /** "Balance view" — see transactions/page.tsx. Swaps the Wallet column for a running-balance one. */
  balanceMode?: boolean;
}) {
  const { searchParams, setFilterParams } = useListParams();
  const { currentSort, currentDir, handleSort } = useSortState<SortKey>(
    balanceMode ? BALANCE_SORT_KEYS : SORT_KEYS
  );

  /** Every cell takes the same sort wiring; only label/key/align/filter differ. */
  const sort = { currentSort, currentDir, onSort: handleSort };

  return (
    <thead>
      <tr className={tableHeadRowClass}>
        <th className={thClass}>
          <TableHeaderCell
            label="Type"
            sortKey="type"
            {...sort}
            filter={
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
            }
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Date"
            sortKey="date"
            {...sort}
            filter={<HeaderDateRangeFilterPopover />}
          />
        </th>
        {!balanceMode && (
          <th className={thClass}>
            <TableHeaderCell
              label="Wallet"
              sortKey="wallet"
              {...sort}
              filter={
                <HeaderFilterPopover
                  label="wallets"
                  value={searchParams.get("wallet") ?? ""}
                  onChange={(v) => setFilterParams({ wallet: v || null })}
                  options={wallets.map((w) => ({ value: w.id, label: w.name }))}
                />
              }
            />
          </th>
        )}
        <th className={thClass}>
          <TableHeaderCell
            label="Category"
            sortKey="category"
            {...sort}
            filter={
              <HeaderFilterPopover
                label="categories"
                value={searchParams.get("category") ?? ""}
                onChange={(v) => setFilterParams({ category: v || null })}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            }
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Entity"
            sortKey="entity"
            {...sort}
            filter={
              <HeaderFilterPopover
                label="entities"
                value={searchParams.get("entity") ?? ""}
                onChange={(v) => setFilterParams({ entity: v || null })}
                options={entities.map((e) => ({ value: e.id, label: e.name }))}
              />
            }
          />
        </th>
        <th className={thClass}>
          <TableHeaderCell
            label="Description"
            sortKey="description"
            {...sort}
            filter={<HeaderTextFilterPopover label="description" paramKey="q" />}
          />
        </th>
        <th className={`${thClass} text-right`}>
          <TableHeaderCell
            label="Net"
            sortKey="net"
            align="right"
            {...sort}
            filter={
              <HeaderNumberRangeFilterPopover
                label="net"
                minParamKey="net_min"
                maxParamKey="net_max"
              />
            }
          />
        </th>
        <th className={`${thClass} text-right`}>
          <TableHeaderCell
            label="VAT"
            sortKey="vat_amount"
            align="right"
            {...sort}
            filter={
              <HeaderNumberRangeFilterPopover
                label="VAT"
                minParamKey="vat_amount_min"
                maxParamKey="vat_amount_max"
              />
            }
          />
        </th>
        <th className={`${thClass} text-right`}>
          <TableHeaderCell
            label="Total"
            sortKey="total"
            align="right"
            {...sort}
            filter={
              <HeaderNumberRangeFilterPopover
                label="total"
                minParamKey="total_min"
                maxParamKey="total_max"
              />
            }
          />
        </th>
        {balanceMode && (
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
        )}
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
