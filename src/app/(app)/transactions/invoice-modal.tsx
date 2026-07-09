"use client";

import { useId, useState, useTransition } from "react";
import type { Transaction } from "./queries";

const inputClass =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function InvoiceModal({
  dialogRef,
  transaction,
  action,
  onDone,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  transaction: Transaction;
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
}) {
  const uid = useId();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      className="w-full max-w-xs bg-transparent [&::backdrop]:bg-ink/40 [&::backdrop]:backdrop-blur-[2px]"
    >
      <form
        action={handleSubmit}
        className="space-y-4 rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-pop)]"
      >
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Invoice month
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Which month&apos;s invoice folder is this filed under? Leave
            blank to clear.
          </p>
        </div>

        <div>
          <label htmlFor={`${uid}-invoice-month`} className="sr-only">
            Invoice month (1–12)
          </label>
          <input
            id={`${uid}-invoice-month`}
            name="invoice_month"
            type="number"
            min="1"
            max="12"
            inputMode="numeric"
            placeholder="e.g. 7"
            autoFocus
            defaultValue={transaction.invoice_month ?? ""}
            className={inputClass}
          />
        </div>

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
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
