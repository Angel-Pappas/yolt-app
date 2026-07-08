"use client";

import { useTransition } from "react";
import { deleteVatRate } from "./vat-rate-actions";
import { TrashIcon } from "@/components/icons";

export function DeleteVatRateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this VAT rate?")) return;
    startTransition(async () => {
      try {
        await deleteVatRate(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete VAT rate"
      className="rounded p-1.5 text-neutral-600 hover:text-red-600 disabled:opacity-50"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
