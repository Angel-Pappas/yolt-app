"use client";

import { useDebouncedParam } from "./use-debounced-param";
import { FilterPopoverShell } from "./filter-popover-shell";

/** A min/max numeric range column filter (e.g. Net, VAT, Total, Balance, Rate). */
const rangeInputClass =
  "w-20 rounded-md border border-edge bg-surface px-2 py-1.5 text-sm font-normal tracking-normal normal-case text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function HeaderNumberRangeFilterPopover({
  label,
  minParamKey,
  maxParamKey,
}: {
  label: string;
  minParamKey: string;
  maxParamKey: string;
}) {
  const min = useDebouncedParam(minParamKey);
  const max = useDebouncedParam(maxParamKey);

  return (
    <FilterPopoverShell
      label={label}
      active={min.urlValue !== "" || max.urlValue !== ""}
    >
      {(close) => (
        <div
          className="flex items-center gap-1.5 p-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              close();
            }
          }}
        >
          <input
            type="number"
            autoFocus
            value={min.inputValue}
            onChange={(e) => min.handleChange(e.target.value)}
            placeholder="Min"
            aria-label={`Minimum ${label}`}
            className={rangeInputClass}
          />
          <span className="text-xs text-ink-faint">–</span>
          <input
            type="number"
            value={max.inputValue}
            onChange={(e) => max.handleChange(e.target.value)}
            placeholder="Max"
            aria-label={`Maximum ${label}`}
            className={rangeInputClass}
          />
        </div>
      )}
    </FilterPopoverShell>
  );
}
