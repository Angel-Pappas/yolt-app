"use client";

import { useEffect, useRef, useState } from "react";
import { FilterIcon } from "@/components/icons";

/**
 * The small filter-icon popover embedded in a column header (e.g.
 * Transactions' Type/Entity/Wallet/VAT columns) — shared by every table
 * that has a categorical/foreign-key column worth filtering by. Reference
 * lists like Entities/Wallets/VAT rates don't use this (nothing
 * categorical to filter on beyond free-text search).
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const hasValue = value !== "";

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Filter by ${label}`}
        className={`relative rounded p-0.5 transition-colors ${
          hasValue ? "text-accent" : "text-ink-faint hover:text-ink"
        }`}
      >
        <FilterIcon className="h-3 w-3" />
        {hasValue && (
          <span className="absolute top-0 right-0 h-[5px] w-[5px] rounded-full bg-accent" />
        )}
      </button>
      {open && (
        <div
          className={`absolute top-full z-20 mt-1.5 min-w-[160px] rounded-lg border border-edge bg-surface-raised p-1 shadow-[var(--shadow-pop)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <button
            type="button"
            onClick={() => select("")}
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
              onClick={() => select(opt.value)}
              className={`block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm font-normal tracking-normal normal-case ${
                value === opt.value
                  ? "font-semibold text-accent"
                  : "text-ink hover:bg-canvas"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
