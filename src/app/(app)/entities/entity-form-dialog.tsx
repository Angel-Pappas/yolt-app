"use client";

import { useId, useTransition } from "react";

type EntityFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
    vat_number: string | null;
  };
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function EntityFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: EntityFormDialogProps) {
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
          <label htmlFor={`${uid}-vat_number`} className="block text-sm">
            VAT number
          </label>
          <input
            id={`${uid}-vat_number`}
            name="vat_number"
            type="text"
            defaultValue={defaultValues?.vat_number ?? ""}
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
