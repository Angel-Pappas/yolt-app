import { createClient } from "@/lib/supabase/server";
import { AddTransactionModal } from "./add-transaction-modal";

type Transaction = {
  id: string;
  date: string;
  amount: string;
  description: string;
};

export default async function TransactionsPage() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, date, amount, description")
    .order("date", { ascending: false })
    .returns<Transaction[]>();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <AddTransactionModal />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Date</th>
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions?.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2">{t.date}</td>
              <td className="py-2">{t.description}</td>
              <td className="py-2 text-right">
                {Number(t.amount).toFixed(2)}
              </td>
            </tr>
          ))}
          {transactions?.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-neutral-500">
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
