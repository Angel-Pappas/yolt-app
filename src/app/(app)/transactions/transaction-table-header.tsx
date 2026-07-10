"use client";

import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { SortableHeaderCell } from "@/components/table/sortable-header-cell";
import { HeaderFilterPopover } from "@/components/table/header-filter-popover";
import { useListParams } from "@/components/table/use-list-params";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../lists/vat-rates/vat-rate-queries";
import type { SortDir, SortKey } from "./queries";

const DEFAULT_SORT: SortKey = "date";
const DEFAULT_DIR: SortDir = "asc";

export function TransactionTableHeader({
  entities,
  wallets,
  vatRates,
}: {
  entities: Entity[];
  wallets: Wallet[];
  vatRates: VatRate[];
}) {
  const { searchParams, setFilterParams } = useListParams();

  const currentSort = (searchParams.get("sort") as SortKey) || DEFAULT_SORT;
  const currentDir: SortDir =
    searchParams.get("dir") === "desc" ? "desc" : DEFAULT_DIR;

  function handleSort(key: SortKey) {
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
          <SortableHeaderCell
            label="Description"
            sortKey="description"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className={`${thClass} text-right`}>
          <SortableHeaderCell
            label="Net"
            sortKey="net"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className={`${thClass} text-right`}>
          <div className="flex items-center justify-end gap-1.5">
            <HeaderFilterPopover
              label="rates"
              value={searchParams.get("vat") ?? ""}
              onChange={(v) => setFilterParams({ vat: v || null })}
              align="right"
              options={vatRates.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.rate}%)`,
              }))}
            />
            <SortableHeaderCell
              label="VAT"
              sortKey="vat"
              currentSort={currentSort}
              currentDir={currentDir}
              align="right"
              onSort={handleSort}
            />
          </div>
        </th>
        <th className={`${thClass} text-right`}>
          <SortableHeaderCell
            label="VAT Amount"
            sortKey="vat_amount"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className={`${thClass} text-right`}>
          <SortableHeaderCell
            label="Total"
            sortKey="total"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className={thClass}></th>
      </tr>
    </thead>
  );
}
