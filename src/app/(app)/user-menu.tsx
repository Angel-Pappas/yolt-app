"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KebabIcon } from "@/components/icons";
import { logout } from "@/app/auth/actions";

export function UserMenu({ name, email }: { name: string | undefined; email: string }) {
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

  const displayName = name || email.split("@")[0] || "Account";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <KebabIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-1.5 min-w-[220px] rounded-lg border border-edge bg-surface-raised p-1 shadow-[var(--shadow-pop)]">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            <p className="truncate text-xs text-ink-faint">{email}</p>
          </div>
          <div className="my-1 border-t border-edge" />
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2.5 py-1.5 text-left text-sm text-ink hover:bg-canvas"
          >
            Account
          </Link>
          <Link
            href="/options"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2.5 py-1.5 text-left text-sm text-ink hover:bg-canvas"
          >
            Options
          </Link>
          <div className="my-1 border-t border-edge" />
          <form action={logout}>
            <button
              type="submit"
              className="block w-full rounded-md px-2.5 py-1.5 text-left text-sm text-ink hover:bg-canvas"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
