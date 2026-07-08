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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Wallets</h1>
        <WalletModal
          trigger="Add wallet"
          title="Add wallet"
          submitLabel="Add"
          action={addWallet}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                Balance
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {wallets?.map((w) => (
              <WalletRow key={w.id} wallet={w} balance={balances.get(w.id) ?? 0} />
            ))}
            {wallets?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-faint">
                  No wallets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
