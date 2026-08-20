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
  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-normal tracking-normal normal-case hover:bg-canvas";

/** A small themed checkbox box — filled with the accent + a check when selected. */
function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        checked ? "border-accent bg-accent text-accent-ink" : "border-edge bg-surface"
      }`}
    >
      {checked && (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      )}
    </span>
  );
}

/**
 * The categorical/foreign-key column filter (Transactions'
 * Type/Entity/Wallet/Category, Categories' Type, Leads' Origin/Status) — a
 * multi-select options list inside the shared FilterPopoverShell.
 *
 * Each option carries a checkbox; ticking several narrows the column to any
 * of them (an `IN (...)` on the server). The `value`/`onChange` boundary is a
 * comma-separated string of the selected option values ("" = none selected),
 * so every caller stays a plain `searchParams.get(key)` / `setFilterParams`
 * pair and the URL param holds `a,b,c`.
 *
 * The list scrolls within the panel and, once it's long enough to be worth
 * it, gets a filter-as-you-type box pinned above it — the same shape a
 * spreadsheet's column filter has, and the thing that makes a ~94-entity
 * list usable rather than a wall to scroll past. The popover stays open as
 * you tick options (multi-select); light-dismiss / Esc close it.
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
      {() => (
        <FilterOptionsList
          label={label}
          options={options}
          value={value}
          onChange={onChange}
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
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const searchable = options.length > SEARCHABLE_THRESHOLD;

  const selected = useMemo(
    () => new Set(value ? value.split(",").filter(Boolean) : []),
    [value]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, query]);

  // Emit the selected values in canonical option order, so the URL param
  // is stable regardless of the order the boxes were ticked.
  function emit(next: Set<string>) {
    onChange(
      options
        .filter((o) => next.has(o.value))
        .map((o) => o.value)
        .join(",")
    );
  }

  function toggle(optValue: string) {
    const next = new Set(selected);
    if (next.has(optValue)) next.delete(optValue);
    else next.add(optValue);
    emit(next);
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
            // Enter ticks the only remaining match — the fast path when
            // you've typed enough to narrow the list to one — then clears the
            // box so the next one can be searched for without closing.
            onKeyDown={(e) => {
              if (e.key === "Enter" && visible.length === 1) {
                e.preventDefault();
                toggle(visible[0].value);
                setQuery("");
              }
            }}
            className={searchInputClass}
          />
        </div>
      )}

      <div className="overflow-y-auto overscroll-contain p-1">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`${optionClass} ${
            selected.size === 0 ? "text-accent" : "text-ink"
          }`}
        >
          <CheckBox checked={selected.size === 0} />
          <span className="truncate">All {label.toLowerCase()}</span>
        </button>
        {visible.map((opt) => {
          const isSelected = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              title={opt.label}
              aria-pressed={isSelected}
              className={`${optionClass} text-ink`}
            >
              <CheckBox checked={isSelected} />
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="px-2.5 py-2 text-sm font-normal tracking-normal normal-case text-ink-faint">
            No {label.toLowerCase()} match “{query}”.
          </p>
        )}
      </div>
    </>
  );
}
