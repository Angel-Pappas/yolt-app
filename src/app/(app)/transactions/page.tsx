import { createClient } from "@/lib/supabase/server";
import { formatAmount, formatDate } from "@/lib/format";
import { addTransaction, updateTransaction } from "./actions";
import { TransactionModal } from "./transaction-modal";
import { DeleteTransactionButton } from "./delete-transaction-button";

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
            <tr key={t.id} className="border-b">
              <td className="py-2">{formatDate(t.date)}</td>
              <td className="py-2">{t.description}</td>
              <td className="py-2 text-right">{formatAmount(t.amount)}</td>
              <td className="py-2">
                <div className="flex justify-end gap-3">
                  <TransactionModal
                    trigger="Edit"
                    triggerClassName="text-sm underline"
                    title="Edit transaction"
                    submitLabel="Save"
                    defaultValues={{
                      date: t.date,
                      amount: t.amount,
                      description: t.description,
                    }}
                    action={updateTransaction.bind(null, t.id)}
                  />
                  <DeleteTransactionButton id={t.id} />
                </div>
              </td>
            </tr>
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
