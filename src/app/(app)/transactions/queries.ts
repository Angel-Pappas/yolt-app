import type { SupabaseClient } from "@supabase/supabase-js";
import { computeTotal } from "@/lib/format";

export type TransactionType = "income" | "expense" | "transfer";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  net: string;
  vat_amount: string;
  created_at: string;
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
 *
 * No `.order()` here — sorting (including by Entity/Wallet name, which
 * are joined columns) is done in JS via `sortTransactions()` below,
 * against the full filtered result, then paginated. Simpler and safer
 * than relying on PostgREST's embedded-resource ordering, and fine at
 * this app's scale; revisit if the transaction count ever gets large
 * enough that fetching the whole filtered set every page load matters.
 */
export async function getActiveTransactions(
  supabase: SupabaseClient,
  filters: TransactionFilters = {}
) {
  let query = supabase
    .from("transactions")
    .select(
      "id, date, description, type, net, vat_amount, created_at, entity:entities(id, name), wallet:wallets!wallet_id(id, name), to_wallet:wallets!to_wallet_id(id, name), vat_rate:vat_rates(id, name, rate)"
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

  return query.returns<Transaction[]>();
}

export type SortKey =
  | "date"
  | "type"
  | "entity"
  | "wallet"
  | "description"
  | "net"
  | "vat"
  | "vat_amount"
  | "total";
export type SortDir = "asc" | "desc";

export const SORT_KEYS: SortKey[] = [
  "date",
  "type",
  "entity",
  "wallet",
  "description",
  "net",
  "vat",
  "vat_amount",
  "total",
];

const SORT_VALUE: Record<SortKey, (t: Transaction) => string | number> = {
  date: (t) => t.date,
  type: (t) => t.type,
  entity: (t) => t.entity?.name ?? "",
  wallet: (t) => t.wallet.name,
  description: (t) => t.description,
  net: (t) => Number(t.net),
  vat: (t) => Number(t.vat_rate?.rate ?? -1),
  vat_amount: (t) => Number(t.vat_amount),
  total: (t) => computeTotal(t.net, t.vat_amount),
};

/**
 * Sorts by the given column, tiebroken by chronological order (date, then
 * created_at) so results are always in a stable, predictable order even
 * when many rows share the same sorted value (e.g. same Type or Wallet).
 */
export function sortTransactions(
  transactions: Transaction[],
  sort: SortKey,
  dir: SortDir
): Transaction[] {
  const getValue = SORT_VALUE[sort];
  const factor = dir === "asc" ? 1 : -1;

  return [...transactions].sort((a, b) => {
    const av = getValue(a);
    const bv = getValue(b);
    if (av < bv) return -1 * factor;
    if (av > bv) return 1 * factor;

    if (sort !== "date" && a.date !== b.date) {
      return a.date < b.date ? -1 : 1;
    }
    return a.created_at < b.created_at ? -1 : 1;
  });
}
