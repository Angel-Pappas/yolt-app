"use client";

import { useEffect, useRef, useState } from "react";
import { useListParams } from "@/components/table/use-list-params";
import type { Wallet } from "../wallets/queries";

/**
 * Entry point for "balance view" (2026-07) — replaces what used to be a
 * separate `/wallets/[id]` ledger page. Off: a plain button that opens a
 * wallet picker; choosing one sets `?balance=<id>` (merged into whatever
 * filters are already on the URL, same as every other filter in this app,
 * so switching modes doesn't lose your place). On: a pill naming the
 * active wallet — click it to switch wallets, or Exit to go back to the
 * normal cross-wallet list.
 */
export function BalanceViewControl({
  wallets,
  activeWallet,
}: {
  wallets: Wallet[];
  activeWallet: Wallet | null;
}) {
  const { setFilterParams } = useListParams();
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

  function choose(walletId: string) {
    setFilterParams({ balance: walletId });
    setOpen(false);
  }

  function exit() {
    setFilterParams({ balance: null });
    setOpen(false);
  }

  const picker = open && (
    <div className="absolute top-full left-0 z-20 mt-1.5 min-w-[180px] rounded-lg border border-edge bg-surface-raised p-1 shadow-[var(--shadow-pop)]">
      {wallets.length === 0 && (
        <p className="px-2.5 py-1.5 text-sm text-ink-faint">No wallets yet.</p>
      )}
      {wallets.map((w) => (
        <button
          key={w.id}
          type="button"
          onClick={() => choose(w.id)}
          className={`block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm ${
            activeWallet?.id === w.id
              ? "font-semibold text-accent"
              : "text-ink hover:bg-canvas"
          }`}
        >
          {w.name}
        </button>
      ))}
    </div>
  );

  if (activeWallet) {
    return (
      <div className="relative" ref={ref}>
        <div className="flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="font-medium hover:underline"
          >
            Balance view: {activeWallet.name}
          </button>
          <span aria-hidden="true" className="text-accent/50">
            ·
          </span>
          <button type="button" onClick={exit} className="hover:underline">
            Exit
          </button>
        </div>
        {picker}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-edge-strong hover:text-ink"
      >
        Balance view
      </button>
      {picker}
    </div>
  );
}
