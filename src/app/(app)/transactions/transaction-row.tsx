"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { TypePill } from "@/components/table/type-pill";
import { computeTotal, formatAmount, formatDate } from "@/lib/format";
import { deleteTransaction, updateTransaction } from "./actions";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { ReconcileButton } from "./reconcile-button";
import { InvoiceButton } from "./invoice-button";
import type { Transaction, TransactionType } from "./queries";
import type { Entity } from "../entities/queries";
import type { Category } from "../lists/categories/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../lists/vat-rates/vat-rate-queries";

const TYPE_LABEL: Record<TransactionType, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
};

const TYPE_COLOR: Record<TransactionType, string> = {
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  transfer: "bg-transfer-soft text-transfer",
};

export function TransactionRow({
  transaction,
  entities,
  categories,
  wallets,
  vatRates,
}: {
  transaction: Transaction;
  entities: Entity[];
  categories: Category[];
  wallets: Wallet[];
  vatRates: VatRate[];
}) {
  const { dialogRef, open, close } = useDialog();
  const isTransfer = transaction.type === "transfer";

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted">
        {formatDate(transaction.date)}
      </td>
      <td className="px-4 py-3">
        <TypePill
          label={TYPE_LABEL[transaction.type]}
          colorClass={TYPE_COLOR[transaction.type]}
        />
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
        <DeleteButton
          action={() => deleteTransaction(transaction.id)}
          confirmMessage="Delete this transaction?"
          label="Delete transaction"
        />

        <TransactionFormDialog
          dialogRef={dialogRef}
          title="Edit transaction"
          submitLabel="Save"
          entities={entities}
          categories={categories}
          wallets={wallets}
          vatRates={vatRates}
          defaultValues={{
            date: transaction.date,
            description: transaction.description,
            type: transaction.type,
            net: transaction.net,
            entity: transaction.entity,
            category: transaction.category,
            wallet_id: transaction.wallet.id,
            to_wallet_id: transaction.to_wallet?.id ?? null,
            vat_rate_id: transaction.vat_rate?.id ?? null,
          }}
          action={updateTransaction.bind(null, transaction.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
