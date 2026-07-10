import Link from "next/link";
import { tableRowClass } from "@/components/table/table-styles";
import { formatAmount, formatMonthYear } from "@/lib/format";
import type { MonthlyVat } from "../queries";

/** The first/last calendar day of a "yyyy-mm" period, for the drill-down link into Transactions. */
function periodBounds(period: string): { from: string; to: string } {
  const [year, month] = period.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { from: `${period}-01`, to: `${period}-${String(lastDay).padStart(2, "0")}` };
}

export function VatRow({ month }: { month: MonthlyVat }) {
  const { from, to } = periodBounds(month.period);

  return (
    <tr className={tableRowClass({ interactive: false })}>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink">
        <Link
          href={`/transactions?invoice_from=${from}&invoice_to=${to}`}
          className="underline decoration-edge-strong underline-offset-4 hover:text-accent hover:decoration-accent"
        >
          {formatMonthYear(month.period)}
        </Link>
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink">
        {formatAmount(month.outputVat)}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink-faint">
        {formatAmount(month.inputVat)}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink">
        {formatAmount(month.net)}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink-faint">
        {formatAmount(month.rolloverIn)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-ink">
        {formatAmount(month.payableThisMonth)}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink-faint">
        {formatAmount(month.payableNextMonth)}
      </td>
    </tr>
  );
}
