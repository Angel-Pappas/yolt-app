"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import { addLead } from "./actions";

/**
 * "Add lead" — captures just the name (the lead/company name), creates the lead,
 * and navigates to its edit page where everything else (origin, contact,
 * description, next step, actions, contacts) is filled in. Bespoke rather than
 * ModalShell because it needs the new id back to navigate.
 */
export function LeadAddModal() {
  const { dialogRef, open, close } = useDialog();
  const router = useRouter();
  const uid = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setName("");
    setError(null);
    open();
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) close();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", name);
        const id = await addLead(formData);
        close();
        router.push(`/leads/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <AddButton trigger="Add lead" onClick={handleOpen} />

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        onCancel={close}
        className="w-full max-w-sm bg-transparent [&::backdrop]:bg-ink/40 [&::backdrop]:backdrop-blur-[2px]"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-pop)]"
        >
          <h2 className="font-display text-lg font-semibold text-ink">Add lead</h2>
          <div>
            <label htmlFor={`${uid}-name`} className={formLabelClass}>
              Name
            </label>
            <input
              id={`${uid}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="Lead or company name"
              className={formInputClass}
            />
          </div>

          {error && (
            <p
              className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-4 pt-1">
            <button
              type="button"
              onClick={close}
              className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
