"use client";

import { useTransition } from "react";
import { deleteEntity } from "./actions";
import { TrashIcon } from "@/components/icons";

export function DeleteEntityButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this entity?")) return;
    startTransition(async () => {
      try {
        await deleteEntity(id);
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
      aria-label="Delete entity"
      className="rounded-md p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:bg-expense-soft hover:text-expense disabled:opacity-50"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
