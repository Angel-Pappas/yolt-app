import { tableRowClass } from "@/components/table/table-styles";
import { formatAmount, formatDate } from "@/lib/format";
import type { WalletLedgerEntry } from "../queries";

const TYPE_COLOR: Record<string, string> = {
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  transfer: "bg-transfer-soft text-transfer",
};

function typeLabel(entry: WalletLedgerEntry): string {
  if (entry.type === "income") return "Income";
  if (entry.type === "expense") return "Expense";
  return `${entry.fromWalletName ?? "—"} → ${entry.toWalletName ?? "—"}`;
}

export function WalletLedgerRow({ entry }: { entry: WalletLedgerEntry }) {
  return (
    <tr className={tableRowClass({ interactive: false })}>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted">
        {formatDate(entry.date)}
      </td>
      <td className="px-4 py-3 text-sm text-ink">{entry.description}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TYPE_COLOR[entry.type]}`}
        >
          {typeLabel(entry)}
        </span>
      </td>
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
