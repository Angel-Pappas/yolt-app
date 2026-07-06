import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
import { getActiveTransactions } from "./queries";
import { TransactionModal } from "./transaction-modal";
import { TransactionRow } from "./transaction-row";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const { data: transactions } = await getActiveTransactions(supabase);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <TransactionModal
          trigger="Add"
          title="Add transaction"
          submitLabel="Add"
          action={addTransaction}
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Date</th>
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Amount</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions?.map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
          {transactions?.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-neutral-500">
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
