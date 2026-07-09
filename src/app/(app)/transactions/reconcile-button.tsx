"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { ReconcileIcon } from "@/components/icons";
import { ReconcileModal } from "./reconcile-modal";
import { reconcileTransaction } from "./actions";
import type { Transaction } from "./queries";
import type { Wallet } from "../wallets/queries";

export function ReconcileButton({
  transaction,
  wallets,
}: {
  transaction: Transaction;
  wallets: Wallet[];
}) {
  const { dialogRef, open, close } = useDialog();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={
          transaction.is_reconciled ? "Reconciled — edit" : "Reconcile transaction"
        }
        className={`rounded-md p-1.5 transition ${
          transaction.is_reconciled
            ? "text-accent hover:bg-accent-soft"
            : "text-ink-faint hover:bg-canvas hover:text-ink"
        }`}
      >
        <ReconcileIcon className="h-4 w-4" />
      </button>

      <ReconcileModal
        dialogRef={dialogRef}
        transaction={transaction}
        wallets={wallets}
        action={reconcileTransaction.bind(null, transaction.id)}
        onDone={close}
      />
    </>
  );
}
