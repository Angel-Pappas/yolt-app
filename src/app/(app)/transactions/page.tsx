import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
import { getActiveTransactions } from "./queries";
import { getActiveEntities } from "../entities/queries";
import { getActiveWallets } from "../wallets/queries";
import { getActiveVatRates } from "../options/vat-rate-queries";
import { TransactionModal } from "./transaction-modal";
import { TransactionRow } from "./transaction-row";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [
    { data: transactions },
    { data: entities },
    { data: wallets },
    { data: vatRates },
  ] = await Promise.all([
    getActiveTransactions(supabase),
    getActiveEntities(supabase),
    getActiveWallets(supabase),
    getActiveVatRates(supabase),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <TransactionModal
          trigger="Add"
          title="Add transaction"
          submitLabel="Add"
          entities={entities ?? []}
          wallets={wallets ?? []}
          vatRates={vatRates ?? []}
          action={addTransaction}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Date</th>
              <th className="py-2">Type</th>
              <th className="py-2">Entity</th>
              <th className="py-2">Wallet</th>
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Net</th>
              <th className="py-2 text-right">VAT</th>
              <th className="py-2 text-right">VAT Amount</th>
              <th className="py-2 text-right">Total</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                entities={entities ?? []}
                wallets={wallets ?? []}
                vatRates={vatRates ?? []}
              />
            ))}
            {transactions?.length === 0 && (
              <tr>
                <td colSpan={10} className="py-4 text-center text-neutral-500">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
