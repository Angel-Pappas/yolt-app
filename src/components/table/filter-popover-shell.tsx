"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FilterIcon } from "@/components/icons";

/**
 * The open/close/outside-click/trigger-button mechanics shared by every
 * header filter popover (categorical, text, number-range, date-range) —
 * extracted from what used to be HeaderFilterPopover's own markup once a
 * second/third/fourth filter *type* needed the exact same shell. Each
 * filter type owns only its body (the `children` render prop, closed over
 * a `close()` callback so a filter can dismiss itself after a selection).
 */
export function FilterPopoverShell({
  label,
  active,
  align = "left",
  children,
}: {
  label: string;
  active: boolean;
  align?: "left" | "right";
  children: (close: () => void) => ReactNode;
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

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Filter by ${label}`}
        className={`relative rounded p-0.5 transition-colors ${
          active ? "text-accent" : "text-ink-faint hover:text-ink"
        }`}
      >
        <FilterIcon className="h-3 w-3" />
        {active && (
          <span className="absolute top-0 right-0 h-[5px] w-[5px] rounded-full bg-accent" />
        )}
      </button>
      {open && (
        <div
          className={`absolute top-full z-20 mt-1.5 min-w-[160px] rounded-lg border border-edge bg-surface-raised p-1 shadow-[var(--shadow-pop)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
