"use client";

import { useTransition } from "react";
import { TrashIcon } from "@/components/icons";

/**
 * The trash-icon delete button shared by every table row — a confirm()
 * prompt, then the action in a transition with the same alert()-on-error
 * fallback every delete used to hand-roll individually. Takes the
 * already-bound Server Action (e.g. `() => deleteEntity(id)`) rather than
 * an id + action pair, so it stays agnostic to what it's deleting.
 */
export function DeleteButton({
  action,
  confirmMessage,
  label,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        await action();
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
      aria-label={label}
      className="rounded-md p-1.5 text-ink-faint transition hover:bg-expense-soft hover:text-expense disabled:opacity-50"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
