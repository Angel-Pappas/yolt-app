import type { SupabaseClient } from "@supabase/supabase-js";

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
  category: { id: string; name: string } | null;
  wallet: { id: string; name: string };
  to_wallet: { id: string; name: string } | null;
  vat_rate: { id: string; name: string; rate: string } | null;
  is_reconciled: boolean;
  /** 1-12, or null if no invoice has been logged for this transaction yet. */
  invoice_month: number | null;
};

export type TransactionFilters = {
  /** Matched against description only (Entity/Wallet/Category each have their own dedicated filter). */
  search?: string;
  type?: TransactionType;
  entityId?: string;
  categoryId?: string;
  /** Matches transactions where this wallet is either side — the single wallet (income/expense) or either the "from" or "to" wallet (transfer). */
  walletId?: string;
  /** Inclusive, ISO "yyyy-mm-dd". */
  dateFrom?: string;
  dateTo?: string;
  netMin?: number;
  netMax?: number;
  vatAmountMin?: number;
  vatAmountMax?: number;
  totalMin?: number;
  totalMax?: number;
};

export type SortKey =
  | "date"
  | "type"
  | "wallet"
  | "category"
  | "entity"
  | "description"
  | "net"
  | "vat_amount"
  | "total";
export type SortDir = "asc" | "desc";

export const SORT_KEYS: SortKey[] = [
  "date",
  "type",
  "wallet",
  "category",
  "entity",
  "description",
  "net",
  "vat_amount",
  "total",
];

/** Maps a sort key to its column on the transactions_expanded view. */
const SORT_COLUMN: Record<SortKey, string> = {
  date: "date",
  type: "type",
  wallet: "wallet_name",
  category: "category_name",
  entity: "entity_name",
  description: "description",
  net: "net",
  vat_amount: "vat_amount",
  total: "total",
};

export type TransactionListParams = {
  filters?: TransactionFilters;
  sort?: SortKey;
  dir?: SortDir;
  page?: number;
  pageSize?: number;
};

export type TransactionListResult = {
  transactions: Transaction[];
  totalCount: number;
};

/** Escapes ILIKE's wildcard characters so a literal "%" or "_" in a search term isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

/** Row shape of the transactions_expanded view (see migration create_transactions_expanded_view_and_indexes). */
type TransactionsExpandedRow = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  net: string;
  vat_amount: string;
  created_at: string;
  entity_id: string | null;
  entity_name: string | null;
  category_id: string | null;
  category_name: string | null;
  wallet_id: string;
  wallet_name: string | null;
  to_wallet_id: string | null;
  to_wallet_name: string | null;
  vat_rate_id: string | null;
  vat_rate_name: string | null;
  vat_rate: string | null;
  is_reconciled: boolean;
  invoice_month: number | null;
};

function toTransaction(row: TransactionsExpandedRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    type: row.type,
    net: row.net,
    vat_amount: row.vat_amount,
    created_at: row.created_at,
    entity: row.entity_id
      ? { id: row.entity_id, name: row.entity_name ?? "" }
      : null,
    category: row.category_id
      ? { id: row.category_id, name: row.category_name ?? "" }
      : null,
    wallet: { id: row.wallet_id, name: row.wallet_name ?? "" },
    to_wallet: row.to_wallet_id
      ? { id: row.to_wallet_id, name: row.to_wallet_name ?? "" }
      : null,
    vat_rate: row.vat_rate_id
      ? {
          id: row.vat_rate_id,
          name: row.vat_rate_name ?? "",
          rate: row.vat_rate ?? "0",
        }
      : null,
    is_reconciled: row.is_reconciled,
    invoice_month: row.invoice_month,
  };
}

/**
 * The single place that knows how to fetch a user's non-deleted
 * transactions. Any future feature that needs the transaction list
 * should call this instead of querying the table directly, so the
 * is_deleted filter can't be forgotten in a new code path (it isn't
 * enforced at the RLS level — see Summary.md for why).
 *
 * Queries `transactions_expanded` (a view flattening entity/wallet/
 * to_wallet/vat_rate names + a computed total onto each row) rather than
 * the raw table, so sorting/filtering/pagination can all happen at the
 * database level via plain PostgREST query params — including sorting by
 * Entity/Wallet, which are joined columns PostgREST can't order a
 * top-level query by directly without this flattening. The view is
 * `security_invoker`, so it's exactly as RLS-safe as querying the base
 * tables directly (see the migration for why that matters).
 *
 * Callers are expected to have already validated `filters`/`sort`
 * (enum/UUID/date format) — see transactions/page.tsx's `parseFilters`/
 * `parseSort` — since malformed values passed straight to `.eq`/`.or` on
 * a uuid column would error out the whole query rather than just
 * matching nothing.
 */
export async function getActiveTransactions(
  supabase: SupabaseClient,
  params: TransactionListParams = {}
): Promise<TransactionListResult> {
  const filters = params.filters ?? {};
  const sort = params.sort ?? "date";
  const dir = params.dir ?? "asc";
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  let query = supabase
    .from("transactions_expanded")
    .select("*", { count: "exact" })
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
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.dateFrom) {
    query = query.gte("date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("date", filters.dateTo);
  }
  if (filters.netMin !== undefined) {
    query = query.gte("net", filters.netMin);
  }
  if (filters.netMax !== undefined) {
    query = query.lte("net", filters.netMax);
  }
  if (filters.vatAmountMin !== undefined) {
    query = query.gte("vat_amount", filters.vatAmountMin);
  }
  if (filters.vatAmountMax !== undefined) {
    query = query.lte("vat_amount", filters.vatAmountMax);
  }
  if (filters.totalMin !== undefined) {
    query = query.gte("total", filters.totalMin);
  }
  if (filters.totalMax !== undefined) {
    query = query.lte("total", filters.totalMax);
  }

  query = query.order(SORT_COLUMN[sort], { ascending: dir === "asc" });
  if (sort !== "date") {
    query = query.order("date", { ascending: true });
  }
  query = query.order("created_at", { ascending: true });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query.returns<TransactionsExpandedRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    transactions: (data ?? []).map(toTransaction),
    totalCount: count ?? 0,
  };
}
