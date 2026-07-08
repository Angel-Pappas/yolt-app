import type { SupabaseClient } from "@supabase/supabase-js";

export type TransactionType = "income" | "expense" | "transfer";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  net: string;
  vat_amount: string;
  entity: { id: string; name: string } | null;
  wallet: { id: string; name: string };
  to_wallet: { id: string; name: string } | null;
  vat_rate: { id: string; name: string; rate: string } | null;
};

/**
 * The single place that knows how to fetch a user's non-deleted
 * transactions. Any future feature that needs the transaction list
 * should call this instead of querying the table directly, so the
 * is_deleted filter can't be forgotten in a new code path (it isn't
 * enforced at the RLS level — see Summary.md for why).
 *
 * `wallet` and `to_wallet` both reference `wallets`, so the FK column is
 * spelled out (`!wallet_id` / `!to_wallet_id`) to disambiguate which
 * relationship each embed follows.
 */
export async function getActiveTransactions(supabase: SupabaseClient) {
  return supabase
    .from("transactions")
    .select(
      "id, date, description, type, net, vat_amount, entity:entities(id, name), wallet:wallets!wallet_id(id, name), to_wallet:wallets!to_wallet_id(id, name), vat_rate:vat_rates(id, name, rate)"
    )
    .eq("is_deleted", false)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<Transaction[]>();
}
