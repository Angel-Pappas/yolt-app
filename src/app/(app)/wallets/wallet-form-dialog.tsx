"use client";

import { useId, useTransition } from "react";

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

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      onDone();
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
      className="w-full max-w-sm bg-transparent [&::backdrop]:bg-black/40"
    >
      <form
        action={handleSubmit}
        className="space-y-3 rounded border bg-white p-6"
      >
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
