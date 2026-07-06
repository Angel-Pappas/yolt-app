"use client";

import { useId, useRef, useTransition } from "react";

type TransactionModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  defaultValues?: {
    date: string;
    amount: string;
    description: string;
  };
  action: (formData: FormData) => Promise<void>;
};

export function TransactionModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  defaultValues,
  action,
}: TransactionModalProps) {
  const uid = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      closeModal();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label={triggerLabel}
        className={
          triggerClassName ?? "rounded bg-black px-3 py-1.5 text-sm text-white"
        }
      >
        {trigger}
      </button>

      <dialog
        ref={dialogRef}
        onCancel={closeModal}
        className="w-full max-w-sm rounded border p-6 [&::backdrop]:bg-black/40"
      >
        <form action={handleSubmit} className="space-y-3">
          <h2 className="text-lg font-semibold">{title}</h2>

          <div>
            <label htmlFor={`${uid}-date`} className="block text-sm">
              Date
            </label>
            <input
              id={`${uid}-date`}
              name="date"
              type="date"
              required
              defaultValue={
                defaultValues?.date ?? new Date().toISOString().slice(0, 10)
              }
              className="w-full rounded border px-2 py-1"
            />
          </div>

          <div>
            <label htmlFor={`${uid}-amount`} className="block text-sm">
              Amount
            </label>
            <input
              id={`${uid}-amount`}
              name="amount"
              type="number"
              step="0.01"
              required
              defaultValue={defaultValues?.amount}
              className="w-full rounded border px-2 py-1"
            />
          </div>

          <div>
            <label htmlFor={`${uid}-description`} className="block text-sm">
              Description
            </label>
            <input
              id={`${uid}-description`}
              name="description"
              type="text"
              required
              defaultValue={defaultValues?.description}
              className="w-full rounded border px-2 py-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded px-3 py-1.5 text-sm underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {isPending ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
