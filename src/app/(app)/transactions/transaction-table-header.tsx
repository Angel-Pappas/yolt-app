"use client";

import { useEffect, useRef, useState } from "react";
import { FilterIcon } from "@/components/icons";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../options/vat-rate-queries";
import type { SortDir, SortKey } from "./queries";
import { useTransactionParams } from "./use-transaction-params";

const DEFAULT_SORT: SortKey = "date";
const DEFAULT_DIR: SortDir = "asc";

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-faint uppercase whitespace-nowrap";

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
      className={`flex items-center gap-1 transition-colors hover:text-ink-muted ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <span className="text-[9px] text-accent">
          {currentDir === "asc" ? "▲" : "▼"}
        </span>
      )}
    </button>
  );
}

function FilterPopover({
  label,
  options,
  value,
  onChange,
  align = "left",
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const hasValue = value !== "";

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Filter by ${label}`}
        className={`relative rounded p-0.5 transition-colors ${
          hasValue ? "text-accent" : "text-ink-faint hover:text-ink"
        }`}
      >
        <FilterIcon className="h-3 w-3" />
        {hasValue && (
          <span className="absolute top-0 right-0 h-[5px] w-[5px] rounded-full bg-accent" />
        )}
      </button>
      {open && (
        <div
          className={`absolute top-full z-20 mt-1.5 min-w-[160px] rounded-lg border border-edge bg-surface-raised p-1 shadow-[var(--shadow-pop)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <button
            type="button"
            onClick={() => select("")}
            className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm font-normal tracking-normal normal-case ${
              value === "" ? "font-semibold text-accent" : "text-ink hover:bg-canvas"
            }`}
          >
            All {label.toLowerCase()}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className={`block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm font-normal tracking-normal normal-case ${
                value === opt.value
                  ? "font-semibold text-accent"
                  : "text-ink hover:bg-canvas"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
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

  return (
    <thead>
      <tr className="border-b border-edge">
        <th className={thClass}>
          <SortButton
            label="Date"
            sortKey="date"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortButton
              label="Type"
              sortKey="type"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <FilterPopover
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
            <SortButton
              label="Entity"
              sortKey="entity"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <FilterPopover
              label="entities"
              value={searchParams.get("entity") ?? ""}
              onChange={(v) => setFilterParams({ entity: v || null })}
              options={entities.map((e) => ({ value: e.id, label: e.name }))}
            />
          </div>
        </th>
        <th className={thClass}>
          <div className="flex items-center gap-1.5">
            <SortButton
              label="Wallet"
              sortKey="wallet"
              currentSort={currentSort}
              currentDir={currentDir}
              onSort={handleSort}
            />
            <FilterPopover
              label="wallets"
              value={searchParams.get("wallet") ?? ""}
              onChange={(v) => setFilterParams({ wallet: v || null })}
              options={wallets.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>
        </th>
        <th className={thClass}>
          <SortButton
            label="Description"
            sortKey="description"
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />
        </th>
        <th className={`${thClass} text-right`}>
          <SortButton
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
            <FilterPopover
              label="rates"
              value={searchParams.get("vat") ?? ""}
              onChange={(v) => setFilterParams({ vat: v || null })}
              align="right"
              options={vatRates.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.rate}%)`,
              }))}
            />
            <SortButton
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
          <SortButton
            label="VAT Amount"
            sortKey="vat_amount"
            currentSort={currentSort}
            currentDir={currentDir}
            align="right"
            onSort={handleSort}
          />
        </th>
        <th className={`${thClass} text-right`}>
          <SortButton
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
