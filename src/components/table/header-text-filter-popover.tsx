"use client";

import { useDebouncedParam } from "./use-debounced-param";
import { FilterPopoverShell } from "./filter-popover-shell";

/**
 * A free-text "contains" column filter (e.g. Entities' Name/VAT number,
 * Transactions' Description). Deliberately bound to the *same* param a
 * page's own toolbar SearchBox already uses (usually `q`) rather than a
 * new param of its own — the header filter is just another entry point
 * onto the one search the page already performs, not a second parallel
 * filter that could disagree with it.
 */
export function HeaderTextFilterPopover({
  label,
  paramKey,
}: {
  label: string;
  paramKey: string;
}) {
  const { urlValue, inputValue, handleChange } = useDebouncedParam(paramKey);

  return (
    <FilterPopoverShell label={label} active={urlValue !== ""}>
      {(close) => (
        <div className="p-2">
          <input
            type="text"
            autoFocus
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                close();
              }
            }}
            placeholder={`Filter by ${label}…`}
            className="w-44 rounded-md border border-edge bg-surface px-2 py-1.5 text-sm font-normal tracking-normal normal-case text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      )}
    </FilterPopoverShell>
  );
}
