"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { InvoiceIcon } from "@/components/icons";
import { InvoiceModal } from "./invoice-modal";
import { setInvoiceMonth } from "./actions";
import type { Transaction } from "./queries";

export function InvoiceButton({ transaction }: { transaction: Transaction }) {
  const { dialogRef, open, close } = useDialog();
  const hasMonth = transaction.invoice_month !== null;
  const notRequired = transaction.invoice_not_required;
  const lit = hasMonth || notRequired;

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={
          hasMonth
            ? `Invoice filed — month ${transaction.invoice_month}`
            : notRequired
              ? "No invoice needed"
              : "Log invoice month"
        }
        className={`relative rounded-md p-1.5 transition ${
          lit
            ? "text-accent hover:bg-accent-soft"
            : "text-ink-faint hover:bg-canvas hover:text-ink"
        }`}
      >
        <InvoiceIcon className="h-4 w-4" notRequired={notRequired} />
        {hasMonth && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-ink">
            {transaction.invoice_month}
          </span>
        )}
      </button>

      <InvoiceModal
        dialogRef={dialogRef}
        transaction={transaction}
        action={setInvoiceMonth.bind(null, transaction.id)}
        onDone={close}
      />
    </>
  );
}
