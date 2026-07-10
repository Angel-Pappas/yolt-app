import { tableRowClass } from "@/components/table/table-styles";
import { IncomeIcon, ExpenseIcon, TransferIcon } from "@/components/icons";
import { formatAmount, formatDate } from "@/lib/format";
import type { WalletLedgerEntry } from "../queries";
import type { TransactionType } from "../../transactions/queries";

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

export function WalletLedgerRow({ entry }: { entry: WalletLedgerEntry }) {
  const TypeIcon = TYPE_ICON[entry.type];

  return (
    <tr className={tableRowClass({ interactive: false })}>
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${TYPE_COLOR[entry.type]}`}
          title={TYPE_LABEL[entry.type]}
          aria-label={TYPE_LABEL[entry.type]}
        >
          <TypeIcon className="h-4 w-4" />
        </span>
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted">
        {formatDate(entry.date)}
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted">{entry.categoryName ?? "—"}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted">
        {entry.entityName ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm text-ink">{entry.description}</td>
      <td
        className={`px-4 py-3 text-right text-sm tabular-nums ${
          entry.amount < 0 ? "text-expense" : "text-ink"
        }`}
      >
        {formatAmount(entry.amount)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-ink">
        {formatAmount(entry.runningBalance)}
      </td>
    </tr>
  );
}
