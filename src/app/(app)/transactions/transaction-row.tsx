"use client";

import { useRef } from "react";
import { computeTotal, formatAmount, formatDate } from "@/lib/format";
import { updateTransaction } from "./actions";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { DeleteTransactionButton } from "./delete-transaction-button";
import type { Transaction, TransactionType } from "./queries";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../options/vat-rate-queries";

const TYPE_LABEL: Record<TransactionType, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
};

const TYPE_COLOR: Record<TransactionType, string> = {
  income: "text-green-700",
  expense: "text-red-700",
  transfer: "text-blue-700",
};

export function TransactionRow({
  transaction,
  entities,
  wallets,
  vatRates,
}: {
  transaction: Transaction;
  entities: Entity[];
  wallets: Wallet[];
  vatRates: VatRate[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isTransfer = transaction.type === "transfer";

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
      <td className={`py-2 ${TYPE_COLOR[transaction.type]}`}>
        {TYPE_LABEL[transaction.type]}
      </td>
      <td className="py-2">{transaction.entity?.name ?? "—"}</td>
      <td className="py-2">
        {isTransfer
          ? `${transaction.wallet.name} → ${transaction.to_wallet?.name ?? "—"}`
          : transaction.wallet.name}
      </td>
      <td className="py-2">{transaction.description}</td>
      <td className="py-2 text-right">{formatAmount(transaction.net)}</td>
      <td className="py-2 text-right">
        {isTransfer ? "—" : `${transaction.vat_rate?.rate ?? "—"}%`}
      </td>
      <td className="py-2 text-right">
        {isTransfer ? "—" : formatAmount(transaction.vat_amount)}
      </td>
      <td className="py-2 text-right">
        {formatAmount(computeTotal(transaction.net, transaction.vat_amount))}
      </td>
      <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteTransactionButton id={transaction.id} />

        <TransactionFormDialog
          dialogRef={dialogRef}
          title="Edit transaction"
          submitLabel="Save"
          entities={entities}
          wallets={wallets}
          vatRates={vatRates}
          defaultValues={{
            date: transaction.date,
            description: transaction.description,
            type: transaction.type,
            net: transaction.net,
            entity: transaction.entity,
            wallet_id: transaction.wallet.id,
            to_wallet_id: transaction.to_wallet?.id ?? null,
            vat_rate_id: transaction.vat_rate?.id ?? null,
          }}
          action={updateTransaction.bind(null, transaction.id)}
          onDone={closeEdit}
        />
      </td>
    </tr>
  );
}
