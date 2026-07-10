"use client";

import { useDebouncedParam } from "./use-debounced-param";
import { FilterPopoverShell } from "./filter-popover-shell";

/** A min/max numeric range column filter (e.g. Net, VAT, Total, Balance, Rate). */
export function HeaderNumberRangeFilterPopover({
  label,
  minParamKey,
  maxParamKey,
  align = "left",
}: {
  label: string;
  minParamKey: string;
  maxParamKey: string;
  align?: "left" | "right";
}) {
  const min = useDebouncedParam(minParamKey);
  const max = useDebouncedParam(maxParamKey);

  return (
    <FilterPopoverShell
      label={label}
      active={min.urlValue !== "" || max.urlValue !== ""}
      align={align}
    >
      {() => (
        <div className="flex items-center gap-1.5 p-1.5">
          <input
            type="number"
            autoFocus
            value={min.inputValue}
            onChange={(e) => min.handleChange(e.target.value)}
            placeholder="Min"
            className="w-20 rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-xs text-ink-faint">–</span>
          <input
            type="number"
            value={max.inputValue}
            onChange={(e) => max.handleChange(e.target.value)}
            placeholder="Max"
            className="w-20 rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      )}
    </FilterPopoverShell>
  );
}
