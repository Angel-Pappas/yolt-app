"use client";

import { useId, useState, useTransition } from "react";
import type { Transaction } from "./queries";
import type { Wallet } from "../wallets/queries";

const inputClass =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const labelClass = "mb-1 block text-sm text-ink-muted";

export function ReconcileModal({
  dialogRef,
  transaction,
  wallets,
  action,
  onDone,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  transaction: Transaction;
  wallets: Wallet[];
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
}) {
  const uid = useId();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [walletId, setWalletId] = useState(transaction.wallet.id);
  const [toWalletId, setToWalletId] = useState(transaction.to_wallet?.id ?? "");

  const isTransfer = transaction.type === "transfer";
  const sameWalletError =
    isTransfer && walletId && toWalletId && walletId === toWalletId;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        setError(null);
        await action(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) {
      onDone();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={onDone}
      className="w-full max-w-sm bg-transparent [&::backdrop]:bg-ink/40 [&::backdrop]:backdrop-blur-[2px]"
    >
      <form
        action={handleSubmit}
        className="space-y-4 rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-pop)]"
      >
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Reconcile transaction
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Correct the real date, amount, or wallet once this actually
            happens, then mark it reconciled — even if nothing changed.
          </p>
        </div>

        <input type="hidden" name="type" value={transaction.type} />

        <div>
          <label htmlFor={`${uid}-date`} className={labelClass}>
            Date
          </label>
          <input
            id={`${uid}-date`}
            name="date"
            type="date"
            required
            defaultValue={transaction.date}
            className={`${inputClass} [color-scheme:light]`}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-net`} className={labelClass}>
            Amount
          </label>
          <input
            id={`${uid}-net`}
            name="net"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={transaction.net}
            className={inputClass}
          />
        </div>

        {isTransfer ? (
          <>
            <div>
              <label htmlFor={`${uid}-from-wallet`} className={labelClass}>
                From wallet
              </label>
              <select
                id={`${uid}-from-wallet`}
                name="wallet_id"
                required
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className={inputClass}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${uid}-to-wallet`} className={labelClass}>
                To wallet
              </label>
              <select
                id={`${uid}-to-wallet`}
                name="to_wallet_id"
                required
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className={inputClass}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {sameWalletError && (
                <p className="mt-1 text-xs text-expense">
                  From and to wallet must be different.
                </p>
              )}
            </div>
          </>
        ) : (
          <div>
            <label htmlFor={`${uid}-wallet`} className={labelClass}>
              Wallet
            </label>
            <select
              id={`${uid}-wallet`}
              name="wallet_id"
              required
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className={inputClass}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-4 pt-1">
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || Boolean(sameWalletError)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Reconcile"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
