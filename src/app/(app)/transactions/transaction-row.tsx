"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { IncomeIcon, ExpenseIcon, TransferIcon, InvoiceIcon } from "@/components/icons";
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

const TYPE_ICON: Record<TransactionType, typeof IncomeIcon> = {
  income: IncomeIcon,
  expense: ExpenseIcon,
  transfer: TransferIcon,
};

export function TransactionRow({
  transaction,
  entities,
  categories,
  wallets,
  vatRates,
  balanceMode = false,
}: {
  transaction: Transaction;
  entities: Entity[];
  categories: Category[];
  wallets: Wallet[];
  vatRates: VatRate[];
  /** "Balance view" — see transactions/page.tsx. Swaps the Wallet column for a running-balance one. */
  balanceMode?: boolean;
}) {
  const { dialogRef, open, close } = useDialog();
  const isTransfer = transaction.type === "transfer";
  const TypeIcon = TYPE_ICON[transaction.type];

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${TYPE_COLOR[transaction.type]}`}
          title={TYPE_LABEL[transaction.type]}
          aria-label={TYPE_LABEL[transaction.type]}
        >
          <TypeIcon className="h-4 w-4" />
        </span>
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted">
        {transaction.invoice_date !== transaction.date ? (
          <span className="flex flex-col gap-0.5 leading-none">
            <span>{formatDate(transaction.date)}</span>
            <span className="inline-flex items-center gap-1 text-[11px] leading-none text-ink-faint">
              <InvoiceIcon className="h-2.5 w-2.5" />
              {formatDate(transaction.invoice_date)}
            </span>
          </span>
        ) : (
          formatDate(transaction.date)
        )}
      </td>
      {!balanceMode && (
        <td className="px-4 py-3 text-sm whitespace-nowrap text-ink">
          {isTransfer ? (
            <span className="flex flex-col gap-0.5 leading-none">
              <span>{transaction.wallet.name}</span>
              <span className="text-[11px] leading-none text-ink-faint">
                → {transaction.to_wallet?.name ?? "—"}
              </span>
            </span>
          ) : (
            transaction.wallet.name
          )}
        </td>
      )}
      <td className="px-4 py-3 text-sm text-ink-muted">
        {transaction.category?.name ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted">
        {isTransfer ? "Transfer" : (transaction.entity?.name ?? "—")}
      </td>
      <td className="px-4 py-3 text-sm text-ink">{transaction.description}</td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink">
        {formatAmount(transaction.net)}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink-faint">
        {isTransfer ? "—" : formatAmount(transaction.vat_amount)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-ink">
        {formatAmount(computeTotal(transaction.net, transaction.vat_amount))}
      </td>
      {balanceMode && (
        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-ink">
          {formatAmount(transaction.runningBalance ?? 0)}
        </td>
      )}
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
            invoice_date: transaction.invoice_date,
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
