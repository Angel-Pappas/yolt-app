"use client";

import { useId } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass } from "@/components/form-styles";
import type { Transaction } from "./queries";

export function InvoiceModal({
  dialogRef,
  transaction,
  action,
  onDone,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  transaction: Transaction;
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
}) {
  const uid = useId();

  return (
    <ModalShell
      dialogRef={dialogRef}
      action={action}
      onDone={onDone}
      submitLabel="Save"
      maxWidth="max-w-xs"
      title="Invoice month"
    >
      <div>
        <label htmlFor={`${uid}-invoice-month`} className="sr-only">
          Invoice month (1–12), or 13 for &quot;not needed&quot;
        </label>
        <input
          id={`${uid}-invoice-month`}
          name="invoice_month"
          type="number"
          min="1"
          max="13"
          inputMode="numeric"
          placeholder="e.g. 7"
          autoFocus
          defaultValue={
            transaction.invoice_not_required ? 13 : transaction.invoice_month ?? ""
          }
          className={formInputClass}
        />
        <p className="mt-1.5 text-xs text-ink-faint">1–12 for the month, or 13 if no invoice is needed.</p>
      </div>
    </ModalShell>
  );
}
