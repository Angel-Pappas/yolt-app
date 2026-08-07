"use client";

import { toLocalIsoDate } from "@/lib/format";
import { DateField } from "@/components/date-field";
import { useListParams } from "./use-list-params";

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
    return { from: toLocalIsoDate(startOfMonth(now)), to: toLocalIsoDate(endOfMonth(now)) };
  }
  if (preset === "last-month") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      from: toLocalIsoDate(startOfMonth(lastMonth)),
      to: toLocalIsoDate(endOfMonth(lastMonth)),
    };
  }
  return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
}

/**
 * Date-range picker + quick presets, shared by every list page that deals
 * with dated transactions over time (Transactions, a wallet's transaction
 * history) — not used by reference lists (Entities, Wallets, VAT rates),
 * where "when was this created" isn't a useful filter. Always paired with
 * the `from`/`to` URL params, same keys everywhere it's used.
 */
export function DateRangeFilter() {
  const { searchParams, setFilterParams } = useListParams();

  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";
  const activePreset = PRESETS.find((p) => {
    const range = presetRange(p.key);
    return (range.from ?? "") === currentFrom && (range.to ?? "") === currentTo;
  })?.key;

  function applyPreset(preset: DatePreset) {
    setFilterParams(presetRange(preset));
  }

  return (
    <>
      <div className="flex items-center gap-1.5 rounded-lg border border-edge bg-canvas p-0.5">
        <DateField
          aria-label="From date"
          value={currentFrom}
          onChange={(iso) => setFilterParams({ from: iso || null })}
          className="w-32 rounded-md border-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none"
        />
        <span className="text-xs text-ink-faint">–</span>
        <DateField
          aria-label="To date"
          value={currentTo}
          onChange={(iso) => setFilterParams({ to: iso || null })}
          className="w-32 rounded-md border-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none"
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
    </>
  );
}
