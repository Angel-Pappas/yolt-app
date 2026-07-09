"use client";

import { useTransition } from "react";
import { deleteWallet } from "./actions";
import { TrashIcon } from "@/components/icons";

export function DeleteWalletButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this wallet?")) return;
    startTransition(async () => {
      try {
        await deleteWallet(id);
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
      aria-label="Delete wallet"
      className="rounded-md p-1.5 text-ink-faint transition hover:bg-expense-soft hover:text-expense disabled:opacity-50"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
