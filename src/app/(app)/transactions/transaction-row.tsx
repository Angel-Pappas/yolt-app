"use client";

import { useRef } from "react";
import { formatAmount, formatDate } from "@/lib/format";
import { updateTransaction } from "./actions";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { DeleteTransactionButton } from "./delete-transaction-button";
import type { Transaction } from "./queries";

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openEdit() {
    if (dialogRef.current?.open) return;
    dialogRef.current?.showModal();
  }

  function closeEdit() {
    dialogRef.current?.close();
  }

  return (
    <tr
      onClick={openEdit}
      className="cursor-pointer border-b hover:bg-neutral-50"
    >
      <td className="py-2">{formatDate(transaction.date)}</td>
      <td className="py-2">{transaction.description}</td>
      <td className="py-2 text-right">{formatAmount(transaction.amount)}</td>
      <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteTransactionButton id={transaction.id} />

        <TransactionFormDialog
          dialogRef={dialogRef}
          title="Edit transaction"
          submitLabel="Save"
          defaultValues={{
            date: transaction.date,
            amount: transaction.amount,
            description: transaction.description,
          }}
          action={updateTransaction.bind(null, transaction.id)}
          onDone={closeEdit}
        />
      </td>
    </tr>
  );
}
