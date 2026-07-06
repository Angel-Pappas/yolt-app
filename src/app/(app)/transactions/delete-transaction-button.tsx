"use client";

import { useTransition } from "react";
import { deleteTransaction } from "./actions";
import { TrashIcon } from "@/components/icons";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this transaction?")) return;
    startTransition(async () => {
      await deleteTransaction(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete transaction"
      className="rounded p-1.5 text-neutral-600 hover:text-red-600 disabled:opacity-50"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
