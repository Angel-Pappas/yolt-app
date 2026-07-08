"use client";

import { useRef, useState } from "react";
import { useTransactionParams } from "./use-transaction-params";

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

/**
 * Search box and date range only — Type/Entity/Wallet/VAT are filtered
 * from their own column headers instead (see transaction-table-header.tsx),
 * keeping this bar for the two things that don't map to a single column.
 */
export function TransactionFiltersBar() {
  const { searchParams, setFilterParams, clearAll } = useTransactionParams();
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

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setFilterParams({ q: value || null }),
      300
    );
  }

  function applyPreset(preset: DatePreset) {
    if (preset === "all-time") {
      setFilterParams({ from: null, to: null });
      return;
    }
    const now = new Date();
    if (preset === "this-month") {
      setFilterParams({
        from: isoDate(startOfMonth(now)),
        to: isoDate(endOfMonth(now)),
      });
    } else if (preset === "last-month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setFilterParams({
        from: isoDate(startOfMonth(lastMonth)),
        to: isoDate(endOfMonth(lastMonth)),
      });
    } else if (preset === "this-year") {
      setFilterParams({
        from: `${now.getFullYear()}-01-01`,
        to: `${now.getFullYear()}-12-31`,
      });
    }
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border p-3">
      <input
        type="text"
        placeholder="Search description..."
        value={searchInput}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="min-w-40 flex-1 rounded border px-2 py-1 text-sm"
      />

      <label className="text-sm text-neutral-500">From</label>
      <input
        type="date"
        value={searchParams.get("from") ?? ""}
        onChange={(e) => setFilterParams({ from: e.target.value || null })}
        className="rounded border px-2 py-1 text-sm"
      />
      <label className="text-sm text-neutral-500">To</label>
      <input
        type="date"
        value={searchParams.get("to") ?? ""}
        onChange={(e) => setFilterParams({ to: e.target.value || null })}
        className="rounded border px-2 py-1 text-sm"
      />

      <div className="flex flex-wrap gap-1">
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
  );
}
