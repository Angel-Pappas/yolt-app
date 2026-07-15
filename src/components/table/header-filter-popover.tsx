"use client";

import { useMemo, useState } from "react";
import { FilterPopoverShell } from "./filter-popover-shell";

/**
 * Above this many options the list gets a search box. Below it, searching
 * is slower than just reading the list (Type has 3 options; Entities has
 * ~94 and is unusable without one).
 */
const SEARCHABLE_THRESHOLD = 8;

/**
 * Deliberately spelled out rather than composed from `formInputClass`,
 * which bakes in both `w-full` and `py-2`: appending a tighter `py-1`
 * after it would not reliably win, since Tailwind orders same-property
 * utilities by where they appear in the generated stylesheet and not by
 * their position in the class string (see Directions.md). Same reason the
 * other filter popovers spell their inputs out too.
 *
 * `w-full` is intentional here — it fills whatever width the options list
 * gives the panel, and can't drive the panel wider than the shell's own
 * max-width, so it can't push the popover sideways.
 */
const searchInputClass =
  "w-full rounded-md border border-edge bg-surface px-2 py-1 text-sm font-normal tracking-normal normal-case text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

const optionClass =
  "block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm font-normal tracking-normal normal-case";

/**
 * The categorical/foreign-key column filter (Transactions'
 * Type/Entity/Wallet/Category, Categories' Type) — an options list body
 * inside the shared FilterPopoverShell.
 *
 * The list scrolls within the panel and, once it's long enough to be worth
 * it, gets a filter-as-you-type box pinned above it — the same shape a
 * spreadsheet's column filter has, and the thing that makes a ~94-entity
 * list usable rather than a wall to scroll past.
 */
export function HeaderFilterPopover({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FilterPopoverShell label={label} active={value !== ""}>
      {(close) => (
        <FilterOptionsList
          label={label}
          options={options}
          value={value}
          onChange={onChange}
          close={close}
        />
      )}
    </FilterPopoverShell>
  );
}

/**
 * Split out as its own component (rather than inlined into the render
 * prop) so the search box's state lives and dies with an open panel —
 * closing the popover unmounts this, which clears a stale query for free.
 */
function FilterOptionsList({
  label,
  options,
  value,
  onChange,
  close,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  close: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchable = options.length > SEARCHABLE_THRESHOLD;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, query]);

  function select(next: string) {
    onChange(next);
    close();
  }

  return (
    <>
      {searchable && (
        <div className="shrink-0 border-b border-edge p-1.5">
          <input
            type="search"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}…`}
            // Enter picks the only remaining match — the fast path when
            // you've typed enough to narrow the list to one.
            onKeyDown={(e) => {
              if (e.key === "Enter" && visible.length === 1) {
                e.preventDefault();
                select(visible[0].value);
              }
            }}
            className={searchInputClass}
          />
        </div>
      )}

      <div className="overflow-y-auto overscroll-contain p-1">
        <button
          type="button"
          onClick={() => select("")}
          className={`${optionClass} ${
            value === "" ? "font-semibold text-accent" : "text-ink hover:bg-canvas"
          }`}
        >
          All {label.toLowerCase()}
        </button>
        {visible.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => select(opt.value)}
            title={opt.label}
            className={`${optionClass} ${
              value === opt.value
                ? "font-semibold text-accent"
                : "text-ink hover:bg-canvas"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {visible.length === 0 && (
          <p className="px-2.5 py-2 text-sm font-normal tracking-normal normal-case text-ink-faint">
            No {label.toLowerCase()} match “{query}”.
          </p>
        )}
      </div>
    </>
  );
}
