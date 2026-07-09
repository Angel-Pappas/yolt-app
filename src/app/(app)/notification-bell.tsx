"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/icons";

/**
 * Placeholder for a real notification system, built later — always shows
 * exactly one static entry so the UI reads the way it will once there's
 * real data behind it, rather than an empty state.
 */
export function NotificationBell() {
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <BellIcon className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full bg-accent" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-1.5 w-72 rounded-lg border border-edge bg-surface-raised p-1 shadow-[var(--shadow-pop)]">
          <p className="px-2.5 py-2 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
            Notifications
          </p>
          <div className="rounded-md px-2.5 py-2">
            <p className="text-sm text-ink">Notifications coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
