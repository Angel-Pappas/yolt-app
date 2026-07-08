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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="space-y-1">
        <Link href="/wallets" className="text-sm underline">
          ← Wallets
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{wallet.name}</h1>
          <p className="text-lg font-semibold">{formatAmount(currentBalance)}</p>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Date</th>
            <th className="py-2">Description</th>
            <th className="py-2">Type</th>
            <th className="py-2 text-right">Amount</th>
            <th className="py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b">
              <td className="py-2">{formatDate(e.date)}</td>
              <td className="py-2">{e.description}</td>
              <td className="py-2">{typeLabel(e)}</td>
              <td className="py-2 text-right">{formatAmount(e.amount)}</td>
              <td className="py-2 text-right">
                {formatAmount(e.runningBalance)}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-neutral-500">
                No transactions for this wallet yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
