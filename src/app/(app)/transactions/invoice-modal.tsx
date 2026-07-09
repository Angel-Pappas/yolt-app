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
          Invoice month (1–12)
        </label>
        <input
          id={`${uid}-invoice-month`}
          name="invoice_month"
          type="number"
          min="1"
          max="12"
          inputMode="numeric"
          placeholder="e.g. 7"
          autoFocus
          defaultValue={transaction.invoice_month ?? ""}
          className={formInputClass}
        />
      </div>
    </ModalShell>
  );
}
