"use client";

import { useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
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

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "this-month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "this-year", label: "This year" },
  { key: "all-time", label: "All time" },
];

function presetRange(preset: DatePreset): { from: string | null; to: string | null } {
  if (preset === "all-time") return { from: null, to: null };
  const now = new Date();
  if (preset === "this-month") {
    return { from: isoDate(startOfMonth(now)), to: isoDate(endOfMonth(now)) };
  }
  if (preset === "last-month") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      from: isoDate(startOfMonth(lastMonth)),
      to: isoDate(endOfMonth(lastMonth)),
    };
  }
  return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
}

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

  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";
  const activePreset = PRESETS.find((p) => {
    const range = presetRange(p.key);
    return (range.from ?? "") === currentFrom && (range.to ?? "") === currentTo;
  })?.key;

  function applyPreset(preset: DatePreset) {
    setFilterParams(presetRange(preset));
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-edge p-4">
      <div className="relative min-w-[180px] flex-1 basis-56">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Search description…"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-lg border border-edge bg-surface py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-edge bg-canvas p-0.5">
        <input
          type="date"
          value={currentFrom}
          onChange={(e) => setFilterParams({ from: e.target.value || null })}
          className="rounded-md border-none bg-transparent px-2 py-1.5 text-sm text-ink [color-scheme:light]"
        />
        <span className="text-xs text-ink-faint">–</span>
        <input
          type="date"
          value={currentTo}
          onChange={(e) => setFilterParams({ to: e.target.value || null })}
          className="rounded-md border-none bg-transparent px-2 py-1.5 text-sm text-ink [color-scheme:light]"
        />
      </div>

      <div className="flex gap-0.5 rounded-lg border border-edge bg-canvas p-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => applyPreset(preset.key)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              activePreset === preset.key
                ? "bg-surface-raised text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="ml-auto text-xs text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-expense"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
