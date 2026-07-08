"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../options/vat-rate-queries";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

type DatePreset = "this-month" | "last-month" | "this-year" | "all-time";

export function TransactionFiltersBar({
  entities,
  wallets,
  vatRates,
}: {
  entities: Entity[];
  wallets: Wallet[];
  vatRates: VatRate[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The search box needs its own state so it can update instantly on every
  // keystroke while the URL (and the server refetch it triggers) only
  // updates after a debounce. Re-synced from the URL on external changes
  // (e.g. the Clear filters button) by adjusting state during render —
  // React's recommended alternative to an effect for this, since it avoids
  // an extra committed render pass.
  const urlSearch = searchParams.get("q") ?? "";
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const [searchInput, setSearchInput] = useState(urlSearch);
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearchInput(urlSearch);
  }

  function setParams(entries: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParams({ q: value || null }), 300);
  }

  function applyPreset(preset: DatePreset) {
    if (preset === "all-time") {
      setParams({ from: null, to: null });
      return;
    }
    const now = new Date();
    if (preset === "this-month") {
      setParams({ from: isoDate(startOfMonth(now)), to: isoDate(endOfMonth(now)) });
    } else if (preset === "last-month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setParams({
        from: isoDate(startOfMonth(lastMonth)),
        to: isoDate(endOfMonth(lastMonth)),
      });
    } else if (preset === "this-year") {
      setParams({ from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` });
    }
  }

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="space-y-2 rounded border p-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search description..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="min-w-40 flex-1 rounded border px-2 py-1 text-sm"
        />

        <select
          value={searchParams.get("type") ?? ""}
          onChange={(e) => setParams({ type: e.target.value || null })}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>

        <select
          value={searchParams.get("entity") ?? ""}
          onChange={(e) => setParams({ entity: e.target.value || null })}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="">All entities</option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("wallet") ?? ""}
          onChange={(e) => setParams({ wallet: e.target.value || null })}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="">All wallets</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("vat") ?? ""}
          onChange={(e) => setParams({ vat: e.target.value || null })}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="">All VAT rates</option>
          {vatRates.map((vatRate) => (
            <option key={vatRate.id} value={vatRate.id}>
              {vatRate.name} ({vatRate.rate}%)
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-neutral-500">From</label>
        <input
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => setParams({ from: e.target.value || null })}
          className="rounded border px-2 py-1 text-sm"
        />
        <label className="text-sm text-neutral-500">To</label>
        <input
          type="date"
          value={searchParams.get("to") ?? ""}
          onChange={(e) => setParams({ to: e.target.value || null })}
          className="rounded border px-2 py-1 text-sm"
        />

        <div className="ml-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => applyPreset("this-month")}
            className="rounded border px-2 py-1 text-xs"
          >
            This month
          </button>
          <button
            type="button"
            onClick={() => applyPreset("last-month")}
            className="rounded border px-2 py-1 text-xs"
          >
            Last month
          </button>
          <button
            type="button"
            onClick={() => applyPreset("this-year")}
            className="rounded border px-2 py-1 text-xs"
          >
            This year
          </button>
          <button
            type="button"
            onClick={() => applyPreset("all-time")}
            className="rounded border px-2 py-1 text-xs"
          >
            All time
          </button>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto rounded px-2 py-1 text-xs underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
