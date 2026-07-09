import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatAmount, formatDate } from "@/lib/format";
import { getWalletLedger, type WalletLedgerEntry } from "../queries";

function typeLabel(entry: WalletLedgerEntry): string {
  if (entry.type === "income") return "Income";
  if (entry.type === "expense") return "Expense";
  return `${entry.fromWalletName ?? "—"} → ${entry.toWalletName ?? "—"}`;
}

const TYPE_COLOR: Record<string, string> = {
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  transfer: "bg-transfer-soft text-transfer",
};

export default async function WalletLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id, name")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (!wallet) {
    notFound();
  }

  const entries = await getWalletLedger(supabase, id);
  const currentBalance = entries.at(-1)?.runningBalance ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="space-y-3">
        <Link
          href="/wallets"
          className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
        >
          ← Wallets
        </Link>
        <div className="flex items-end justify-between">
          <h1 className="font-display text-3xl font-bold text-ink">
            {wallet.name}
          </h1>
          <p
            className={`text-2xl font-semibold tabular-nums ${
              currentBalance < 0 ? "text-expense" : "text-ink"
            }`}
          >
            {formatAmount(currentBalance)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge-strong bg-surface-header">
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-b border-edge last:border-b-0 even:bg-surface-alt hover:bg-canvas"
              >
                <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted">
                  {formatDate(e.date)}
                </td>
                <td className="px-4 py-3 text-sm text-ink">{e.description}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TYPE_COLOR[e.type]}`}
                  >
                    {typeLabel(e)}
                  </span>
                </td>
                <td
                  className={`px-4 py-3 text-right text-sm tabular-nums ${
                    e.amount < 0 ? "text-expense" : "text-ink"
                  }`}
                >
                  {formatAmount(e.amount)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-ink">
                  {formatAmount(e.runningBalance)}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-faint">
                  No transactions for this wallet yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
