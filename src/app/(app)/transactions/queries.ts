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

export type TransactionFilters = {
  /** Matched against description only (Entity/Wallet/VAT each have their own dedicated filter). */
  search?: string;
  type?: TransactionType;
  entityId?: string;
  /** Matches transactions where this wallet is either side — the single wallet (income/expense) or either the "from" or "to" wallet (transfer). */
  walletId?: string;
  vatRateId?: string;
  /** Inclusive, ISO "yyyy-mm-dd". */
  dateFrom?: string;
  dateTo?: string;
};

/** Escapes ILIKE's wildcard characters so a literal "%" or "_" in a search term isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

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
 *
 * Callers are expected to have already validated `filters` (enum/UUID/date
 * format) — see transactions/page.tsx's `parseFilters` — since malformed
 * values passed straight to `.eq`/`.or` on a uuid column would error out
 * the whole query rather than just matching nothing.
 */
export async function getActiveTransactions(
  supabase: SupabaseClient,
  filters: TransactionFilters = {}
) {
  let query = supabase
    .from("transactions")
    .select(
      "id, date, description, type, net, vat_amount, entity:entities(id, name), wallet:wallets!wallet_id(id, name), to_wallet:wallets!to_wallet_id(id, name), vat_rate:vat_rates(id, name, rate)"
    )
    .eq("is_deleted", false);

  if (filters.search) {
    query = query.ilike("description", `%${escapeLikePattern(filters.search)}%`);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }
  if (filters.walletId) {
    query = query.or(
      `wallet_id.eq.${filters.walletId},to_wallet_id.eq.${filters.walletId}`
    );
  }
  if (filters.vatRateId) {
    query = query.eq("vat_rate_id", filters.vatRateId);
  }
  if (filters.dateFrom) {
    query = query.gte("date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("date", filters.dateTo);
  }

  return query
    .order("date", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Transaction[]>();
}
