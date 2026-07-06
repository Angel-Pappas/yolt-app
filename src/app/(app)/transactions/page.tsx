import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";

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
      <h1 className="text-xl font-semibold">Transactions</h1>

      <form
        action={addTransaction}
        className="flex flex-wrap items-end gap-3 rounded border p-4"
      >
        <div>
          <label htmlFor="date" className="block text-sm">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded border px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            required
            className="w-28 rounded border px-2 py-1"
          />
        </div>
        <div className="min-w-48 flex-1">
          <label htmlFor="description" className="block text-sm">
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            required
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-black px-3 py-1.5 text-white"
        >
          Add
        </button>
      </form>

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
