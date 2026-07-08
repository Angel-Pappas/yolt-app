import type { SupabaseClient } from "@supabase/supabase-js";
import { computeTotal } from "@/lib/format";
import type { TransactionType } from "../transactions/queries";

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
  type: TransactionType;
  wallet_id: string;
  to_wallet_id: string | null;
  net: string;
  vat_amount: string;
};

/**
 * Current balance per wallet, computed live from every active
 * transaction that touches it. There is no stored balance column, so
 * this can never drift out of sync — editing, deleting, or restoring a
 * transaction is automatically reflected.
 *
 * Income adds (net + vat_amount) to its wallet, expense subtracts it.
 * A transfer has no VAT (net = the full amount moved) and subtracts
 * from its `wallet_id` (the "from" side) while adding to its
 * `to_wallet_id` (the "to" side).
 */
export async function getWalletBalances(
  supabase: SupabaseClient
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("type, wallet_id, to_wallet_id, net, vat_amount")
    .eq("is_deleted", false)
    .returns<WalletTransactionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const balances = new Map<string, number>();
  function add(walletId: string, amount: number) {
    balances.set(walletId, (balances.get(walletId) ?? 0) + amount);
  }

  for (const row of data ?? []) {
    if (row.type === "transfer") {
      const net = Number(row.net);
      add(row.wallet_id, -net);
      add(row.to_wallet_id as string, net);
      continue;
    }

    const total = computeTotal(row.net, row.vat_amount);
    add(row.wallet_id, row.type === "income" ? total : -total);
  }

  return balances;
}

export type WalletLedgerEntry = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  /** Signed from this specific wallet's point of view. */
  amount: number;
  /** For transfers, the "from" and "to" wallet names (same order as the Transactions page's X → Y). */
  fromWalletName: string | null;
  toWalletName: string | null;
  runningBalance: number;
};

type WalletLedgerRow = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  net: string;
  vat_amount: string;
  wallet_id: string;
  to_wallet_id: string | null;
  wallet: { name: string } | null;
  to_wallet: { name: string } | null;
};

/**
 * A wallet's transactions with a running balance attached to each one,
 * computed by walking the ledger in chronological order. Returned
 * newest-first to match the rest of the app's display convention.
 *
 * Fetches all active transactions (like getWalletBalances) and filters
 * in JS rather than filtering server-side on wallet_id/to_wallet_id —
 * simpler than building an `.or()` filter string, and fine at this
 * app's scale.
 */
export async function getWalletLedger(
  supabase: SupabaseClient,
  walletId: string
): Promise<WalletLedgerEntry[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, date, description, type, net, vat_amount, wallet_id, to_wallet_id, wallet:wallets!wallet_id(name), to_wallet:wallets!to_wallet_id(name), created_at"
    )
    .eq("is_deleted", false)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<WalletLedgerRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const relevant = (data ?? []).filter(
    (row) => row.wallet_id === walletId || row.to_wallet_id === walletId
  );

  let running = 0;
  const entries = relevant.map((row) => {
    let amount: number;
    let fromWalletName: string | null = null;
    let toWalletName: string | null = null;

    if (row.type === "transfer") {
      const isFromSide = row.wallet_id === walletId;
      amount = isFromSide ? -Number(row.net) : Number(row.net);
      fromWalletName = row.wallet?.name ?? null;
      toWalletName = row.to_wallet?.name ?? null;
    } else {
      const total = computeTotal(row.net, row.vat_amount);
      amount = row.type === "income" ? total : -total;
    }

    running += amount;
    return {
      id: row.id,
      date: row.date,
      description: row.description,
      type: row.type,
      amount,
      fromWalletName,
      toWalletName,
      runningBalance: running,
    };
  });

  return entries.reverse();
}
