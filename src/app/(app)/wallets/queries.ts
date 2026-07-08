import type { SupabaseClient } from "@supabase/supabase-js";
import { computeTotal } from "@/lib/format";

export type Wallet = {
  id: string;
  name: string;
};

/**
 * The single place that knows how to fetch a user's non-deleted wallets.
 * See transactions/queries.ts for why filtering is done here and not in
 * the SELECT RLS policy.
 */
export async function getActiveWallets(supabase: SupabaseClient) {
  return supabase
    .from("wallets")
    .select("id, name")
    .eq("is_deleted", false)
    .order("name", { ascending: true })
    .returns<Wallet[]>();
}

type WalletTransactionRow = {
  wallet_id: string | null;
  net: string;
  vat_amount: string;
};

/**
 * Current balance per wallet, computed live as the sum of (net + vat_amount)
 * across all non-deleted transactions for that wallet. There is no stored
 * balance column, so this can never drift out of sync with the ledger —
 * editing, deleting, or restoring a transaction is automatically reflected.
 */
export async function getWalletBalances(
  supabase: SupabaseClient
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("wallet_id, net, vat_amount")
    .eq("is_deleted", false)
    .returns<WalletTransactionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const balances = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.wallet_id) continue;
    const total = computeTotal(row.net, row.vat_amount);
    balances.set(row.wallet_id, (balances.get(row.wallet_id) ?? 0) + total);
  }
  return balances;
}

export type WalletLedgerEntry = {
  id: string;
  date: string;
  description: string;
  net: string;
  vat_amount: string;
  runningBalance: number;
};

/**
 * A wallet's transactions with a running balance attached to each one,
 * computed by walking the ledger in chronological order. Returned
 * newest-first to match the rest of the app's display convention.
 */
export async function getWalletLedger(
  supabase: SupabaseClient,
  walletId: string
): Promise<WalletLedgerEntry[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, date, description, net, vat_amount, created_at")
    .eq("is_deleted", false)
    .eq("wallet_id", walletId)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  let running = 0;
  const entries = (data ?? []).map((row) => {
    running += computeTotal(row.net, row.vat_amount);
    return {
      id: row.id as string,
      date: row.date as string,
      description: row.description as string,
      net: row.net as string,
      vat_amount: row.vat_amount as string,
      runningBalance: running,
    };
  });

  return entries.reverse();
}
