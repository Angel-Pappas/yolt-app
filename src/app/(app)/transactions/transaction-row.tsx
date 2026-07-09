"use client";

import { useRef } from "react";
import { tableRowClass } from "@/components/table/table-styles";
import { computeTotal, formatAmount, formatDate } from "@/lib/format";
import { updateTransaction } from "./actions";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { DeleteTransactionButton } from "./delete-transaction-button";
import { ReconcileButton } from "./reconcile-button";
import { InvoiceButton } from "./invoice-button";
import type { Transaction, TransactionType } from "./queries";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../options/vat-rate-queries";

const TYPE_LABEL: Record<TransactionType, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
};

const TYPE_PILL: Record<TransactionType, string> = {
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  transfer: "bg-transfer-soft text-transfer",
};

function TypePill({ type }: { type: TransactionType }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TYPE_PILL[type]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "currentColor" }}
      />
      {TYPE_LABEL[type]}
    </span>
  );
}

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
      className={tableRowClass()}
    >
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted">
        {formatDate(transaction.date)}
      </td>
      <td className="px-4 py-3">
        <TypePill type={transaction.type} />
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted">
        {transaction.entity?.name ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink">
        {isTransfer ? (
          <span className="inline-flex items-center gap-1.5">
            {transaction.wallet.name}
            <span className="text-ink-faint">→</span>
            {transaction.to_wallet?.name ?? "—"}
          </span>
        ) : (
          transaction.wallet.name
        )}
      </td>
      <td className="px-4 py-3 text-sm text-ink">{transaction.description}</td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink">
        {formatAmount(transaction.net)}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink-faint">
        {isTransfer ? "—" : `${transaction.vat_rate?.rate ?? "—"}%`}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink-faint">
        {isTransfer ? "—" : formatAmount(transaction.vat_amount)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-ink">
        {formatAmount(computeTotal(transaction.net, transaction.vat_amount))}
      </td>
      <td
        className="px-4 py-3 text-right whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <ReconcileButton transaction={transaction} wallets={wallets} />
        <InvoiceButton transaction={transaction} />
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
