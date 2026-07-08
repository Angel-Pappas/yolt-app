import { createClient } from "@/lib/supabase/server";
import { addWallet } from "./actions";
import { getActiveWallets, getWalletBalances } from "./queries";
import { WalletModal } from "./wallet-modal";
import { WalletRow } from "./wallet-row";

export default async function WalletsPage() {
  const supabase = await createClient();

  const [{ data: wallets }, balances] = await Promise.all([
    getActiveWallets(supabase),
    getWalletBalances(supabase),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Wallets</h1>
        <WalletModal
          trigger="Add"
          title="Add wallet"
          submitLabel="Add"
          action={addWallet}
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Name</th>
            <th className="py-2 text-right">Balance</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {wallets?.map((w) => (
            <WalletRow key={w.id} wallet={w} balance={balances.get(w.id) ?? 0} />
          ))}
          {wallets?.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-neutral-500">
                No wallets yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
