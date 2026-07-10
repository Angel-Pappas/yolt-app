"use client";

import { FilterPopoverShell } from "./filter-popover-shell";

/**
 * The categorical/foreign-key column filter (e.g. Transactions'
 * Type/Entity/Wallet/Category columns) — an options list body inside the
 * shared FilterPopoverShell.
 */
export function HeaderFilterPopover({
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
  return (
    <FilterPopoverShell label={label} active={value !== ""} align={align}>
      {(close) => (
        <>
          <button
            type="button"
            onClick={() => {
              onChange("");
              close();
            }}
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
              onClick={() => {
                onChange(opt.value);
                close();
              }}
              className={`block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm font-normal tracking-normal normal-case ${
                value === opt.value
                  ? "font-semibold text-accent"
                  : "text-ink hover:bg-canvas"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </>
      )}
    </FilterPopoverShell>
  );
}
