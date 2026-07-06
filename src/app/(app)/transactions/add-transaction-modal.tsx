"use client";

import { useRef, useTransition } from "react";
import { addTransaction } from "./actions";

export function AddTransactionModal() {
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
      await addTransaction(formData);
      closeModal();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded bg-black px-3 py-1.5 text-sm text-white"
      >
        Add
      </button>

      <dialog
        ref={dialogRef}
        onCancel={closeModal}
        className="w-full max-w-sm rounded border p-6 [&::backdrop]:bg-black/40"
      >
        <form action={handleSubmit} className="space-y-3">
          <h2 className="text-lg font-semibold">Add transaction</h2>

          <div>
            <label htmlFor="date" className="block text-sm">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded border px-2 py-1"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              className="w-full rounded border px-2 py-1"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm">
              Description
            </label>
            <input
              id="description"
              name="description"
              type="text"
              required
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
              {isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
