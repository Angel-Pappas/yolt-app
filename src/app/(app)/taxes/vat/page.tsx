import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatAmount, formatMonthYear } from "@/lib/format";
import { thClass, tableHeadRowClass, tableRowClass } from "@/components/table/table-styles";
import { getMonthlyVat } from "../queries";

/** The first/last calendar day of a "yyyy-mm" period, for the drill-down link into Transactions. */
function periodBounds(period: string): { from: string; to: string } {
  const [year, month] = period.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { from: `${period}-01`, to: `${period}-${String(lastDay).padStart(2, "0")}` };
}

/**
 * A read-only report, not a CRUD list — deliberately doesn't use the
 * shared table template (search/sort/filter/pagination don't apply to a
 * fixed, small set of calendar months). Each month links into Transactions
 * filtered by `invoice_from`/`invoice_to` (not `from`/`to` — those filter
 * by the transaction's own date) so "which transactions make up this
 * month's VAT" reuses the existing table instead of a bespoke breakdown.
 */
export default async function VatTaxPage() {
  const supabase = await createClient();
  const months = await getMonthlyVat(supabase);

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="space-y-3">
        <Link
          href="/taxes"
          className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
        >
          ← Taxes
        </Link>
        <h1 className="font-display text-3xl font-bold text-ink">VAT</h1>
      </div>

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Month</th>
                <th className={`${thClass} text-right`}>Output VAT</th>
                <th className={`${thClass} text-right`}>Input VAT</th>
                <th className={`${thClass} text-right`}>Net</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const { from, to } = periodBounds(m.period);
                return (
                  <tr key={m.period} className={tableRowClass({ interactive: false })}>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-ink">
                      <Link
                        href={`/transactions?invoice_from=${from}&invoice_to=${to}`}
                        className="underline decoration-edge-strong underline-offset-4 hover:text-accent hover:decoration-accent"
                      >
                        {formatMonthYear(m.period)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-ink">
                      {formatAmount(m.outputVat)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-ink-faint">
                      {formatAmount(m.inputVat)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-ink">
                      {formatAmount(m.net)}
                    </td>
                  </tr>
                );
              })}
              {months.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-faint">
                    No VAT-bearing transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
