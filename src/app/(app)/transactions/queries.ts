import type { SupabaseClient } from "@supabase/supabase-js";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  net: string;
  vat_amount: string;
  entity: { id: string; name: string } | null;
  wallet: { id: string; name: string } | null;
  vat_rate: { id: string; name: string; rate: string } | null;
};

/**
 * The single place that knows how to fetch a user's non-deleted
 * transactions. Any future feature that needs the transaction list
 * should call this instead of querying the table directly, so the
 * is_deleted filter can't be forgotten in a new code path (it isn't
 * enforced at the RLS level — see Summary.md for why).
 */
export async function getActiveTransactions(supabase: SupabaseClient) {
  return supabase
    .from("transactions")
    .select(
      "id, date, description, net, vat_amount, entity:entities(id, name), wallet:wallets(id, name), vat_rate:vat_rates(id, name, rate)"
    )
    .eq("is_deleted", false)
    .order("date", { ascending: false })
    .returns<Transaction[]>();
}
