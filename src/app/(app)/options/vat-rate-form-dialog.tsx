"use client";

import { useId, useTransition } from "react";

type VatRateFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
    rate: string;
  };
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function VatRateFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: VatRateFormDialogProps) {
  const uid = useId();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      onDone();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => e.stopPropagation()}
      onCancel={onDone}
      className="w-full max-w-sm rounded border p-6 [&::backdrop]:bg-black/40"
    >
      <form action={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>

        <div>
          <label htmlFor={`${uid}-name`} className="block text-sm">
            Name
          </label>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
            className="w-full rounded border px-2 py-1"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-rate`} className="block text-sm">
            Rate (%)
          </label>
          <input
            id={`${uid}-rate`}
            name="rate"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.rate}
            className="w-full rounded border px-2 py-1"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onDone}
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
  );
}
