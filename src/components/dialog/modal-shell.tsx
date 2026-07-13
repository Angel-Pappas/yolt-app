"use client";

import type { ReactNode } from "react";
import { useFormAction } from "./use-form-action";

async function noopAction(): Promise<void> {}

/**
 * The chrome every dialog form shares: the <dialog>/backdrop-click-to-
 * close, the <form> wrapper, the error banner, and the Cancel/Submit row
 * — everything *except* the fields themselves, which differ per modal
 * (Transaction has ~9, VAT rate has 2, Invoice has 1) and are passed in
 * as children. See Summary.md for why this split (mechanics shared,
 * fields per-modal) rather than one generic field-driven form component.
 *
 * `dialogChildren` is for the rare case of a dialog-within-a-dialog (the
 * transaction form's "+ Add" entity dialog) — it must render as a
 * sibling of the outer <form>, not nested inside it, since a <form>
 * can't validly contain another <form>. See transaction-form-dialog.tsx.
 */
export function ModalShell({
  dialogRef,
  title,
  submitLabel,
  action,
  onDone,
  maxWidth = "max-w-sm",
  submitDisabled = false,
  dialogChildren,
  footer,
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: ReactNode;
  submitLabel?: string;
  action?: (formData: FormData) => Promise<void>;
  onDone: () => void;
  maxWidth?: string;
  submitDisabled?: boolean;
  dialogChildren?: ReactNode;
  /**
   * Overrides the default Cancel/Submit row entirely — used by
   * Transactions' Add flow, which needs several differently-behaved
   * submit buttons (Cancel / Add + New / Add + Same / Add) instead of
   * one. When given, `action`/`submitLabel` are unused here — the footer
   * owns its own submission wiring and error display, since each button
   * needs its own success behavior. See transaction-form-dialog.tsx.
   */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { handleSubmit, isPending, error } = useFormAction(
    action ?? noopAction,
    onDone
  );

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
      className={`w-full ${maxWidth} bg-transparent [&::backdrop]:bg-ink/40 [&::backdrop]:backdrop-blur-[2px]`}
    >
      <form
        action={footer ? noopAction : handleSubmit}
        className="space-y-4 rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-pop)]"
      >
        {typeof title === "string" ? (
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        ) : (
          title
        )}

        {children}

        {!footer && error && (
          <p
            className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense"
            role="alert"
          >
            {error}
          </p>
        )}

        {footer ?? (
          <div className="flex justify-end gap-4 pt-1">
            <button
              type="button"
              onClick={onDone}
              className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || submitDisabled}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
            >
              {isPending ? "Saving…" : submitLabel}
            </button>
          </div>
        )}
      </form>

      {dialogChildren}
    </dialog>
  );
}
