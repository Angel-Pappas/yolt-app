import type { SupabaseClient } from "@supabase/supabase-js";

export type Transaction = {
  id: string;
  date: string;
  amount: string;
  description: string;
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
    .select("id, date, amount, description")
    .eq("is_deleted", false)
    .order("date", { ascending: false })
    .returns<Transaction[]>();
}
