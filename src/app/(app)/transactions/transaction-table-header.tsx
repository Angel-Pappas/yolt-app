"use client";

import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../options/vat-rate-queries";
import type { SortDir, SortKey } from "./queries";
import { useTransactionParams } from "./use-transaction-params";

const DEFAULT_SORT: SortKey = "date";
const DEFAULT_DIR: SortDir = "asc";

function SortButton({
  label,
  sortKey,
  currentSort,
  currentDir,
  align = "left",
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  align?: "left" | "right";
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentSort === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex w-full items-center gap-1 font-medium ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <span className="text-xs text-neutral-500">
          {currentDir === "asc" ? "▲" : "▼"}
        </span>
      )}
    </button>
  );
}

export function TransactionTableHeader({
  entities,
  wallets,
  vatRates,
}: {
  entities: Entity[];
  wallets: Wallet[];
  vatRates: VatRate[];
}) {
  const { searchParams, setFilterParams } = useTransactionParams();

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

  const selectClass =
    "mt-1 block w-full rounded border px-1 py-0.5 text-xs font-normal";

  return (
    <thead>
      <tr className="border-b text-left">
        <th className="py-2">
          <SortButton
            label="Date"
            sortKey="date"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className="py-2">
          <SortButton
            label="Type"
            sortKey="type"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
          <select
            value={searchParams.get("type") ?? ""}
            onChange={(e) => setFilterParams({ type: e.target.value || null })}
            className={selectClass}
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
        </th>
        <th className="py-2">
          <SortButton
            label="Entity"
            sortKey="entity"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
          <select
            value={searchParams.get("entity") ?? ""}
            onChange={(e) => setFilterParams({ entity: e.target.value || null })}
            className={selectClass}
          >
            <option value="">All</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </th>
        <th className="py-2">
          <SortButton
            label="Wallet"
            sortKey="wallet"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
          <select
            value={searchParams.get("wallet") ?? ""}
            onChange={(e) => setFilterParams({ wallet: e.target.value || null })}
            className={selectClass}
          >
            <option value="">All</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
        </th>
        <th className="py-2">
          <SortButton
            label="Description"
            sortKey="description"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className="py-2 text-right">
          <SortButton
            label="Net"
            sortKey="net"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className="py-2 text-right">
          <SortButton
            label="VAT"
            sortKey="vat"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
          <select
            value={searchParams.get("vat") ?? ""}
            onChange={(e) => setFilterParams({ vat: e.target.value || null })}
            className={selectClass}
          >
            <option value="">All</option>
            {vatRates.map((vatRate) => (
              <option key={vatRate.id} value={vatRate.id}>
                {vatRate.name}
              </option>
            ))}
          </select>
        </th>
        <th className="py-2 text-right">
          <SortButton
            label="VAT Amount"
            sortKey="vat_amount"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className="py-2 text-right">
          <SortButton
            label="Total"
            sortKey="total"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className="py-2 text-right">Actions</th>
      </tr>
    </thead>
  );
}
