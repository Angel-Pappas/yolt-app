"use client";

import { useId, useState, useTransition } from "react";

type WalletFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
  };
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function WalletFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: WalletFormDialogProps) {
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

  // A click that lands exactly on the <dialog> element itself (not a
  // descendant) is a click on the backdrop — close on that, same as Esc.
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
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>

        <div>
          <label htmlFor={`${uid}-name`} className="mb-1 block text-sm text-ink-muted">
            Name
          </label>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
            {isPending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
