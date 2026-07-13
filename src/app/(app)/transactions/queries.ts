import type { SupabaseClient } from "@supabase/supabase-js";
import { computeTotal } from "@/lib/format";

export type TransactionType = "income" | "expense" | "transfer";

export type Transaction = {
  id: string;
  date: string;
  /**
   * When the invoice was issued — may differ from `date` (when the money
   * actually moved). Drives which month's tax period this transaction
   * belongs to (see taxes/queries.ts); defaults to `date` at save time and
   * isn't kept in sync afterward. Not shown as its own column — the Date
   * cell stacks it beneath `date` only when the two differ.
   */
  invoice_date: string;
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
  /** 1-12, or null if no invoice has been logged for this transaction yet — see invoice_not_required for the third "confirmed, no invoice needed" state. */
  invoice_month: number | null;
  /** True only when the user has explicitly confirmed this transaction needs no invoice (e.g. payroll) — mutually exclusive with invoice_month being set (DB-enforced). Distinct from invoice_month being null, which just means "not reviewed yet." */
  invoice_not_required: boolean;
  /**
   * The transaction's amount breakdown (transaction_vat_lines) — almost
   * always exactly one line mirroring net/vat_rate above, occasionally
   * more for a transaction split across VAT rates (see Summary.md).
   * Empty for a transfer. Only actually needed by the edit dialog (to
   * seed its line editor); every other consumer keeps using the summed
   * net/vat_amount/vat_rate fields above, which are unaffected by how
   * many lines make them up.
   */
  vatLines: { net: string; vat_rate_id: string | null }[];
  /**
   * Only set in "balance view" (see getWalletTransactionsWithBalance below)
   * — the running balance of one specific wallet as of this row, walking
   * that wallet's full history chronologically. Undefined everywhere else.
   */
  runningBalance?: number;
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
  /** Filters on invoice_date rather than date — used by the Taxes page's monthly drill-down links. Inclusive, ISO "yyyy-mm-dd". */
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
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
  | "total"
  | "balance";
export type SortDir = "asc" | "desc";

/** Valid sort keys for the normal (all-wallets) list — no "balance" column exists there. */
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

/** Valid sort keys in balance view (see getWalletTransactionsWithBalance) — no "wallet" column, since the list is already scoped to one. */
export const BALANCE_SORT_KEYS: SortKey[] = [
  "date",
  "type",
  "category",
  "entity",
  "description",
  "net",
  "vat_amount",
  "total",
  "balance",
];

/** Maps a sort key to its column on the transactions_expanded view (only the normal, DB-sorted list uses this — "balance" has no DB column, since it's computed in JS by getWalletTransactionsWithBalance). */
const SORT_COLUMN: Partial<Record<SortKey, string>> = {
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
  invoice_date: string;
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
  invoice_not_required: boolean;
};

function toTransaction(row: TransactionsExpandedRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    invoice_date: row.invoice_date,
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
    invoice_not_required: row.invoice_not_required,
    vatLines: [],
  };
}

/**
 * Fills in each transaction's `vatLines` from transaction_vat_lines, keyed
 * by transaction_id. Only called on the page of rows actually being
 * returned (25 max) — this is the one piece the flattened
 * transactions_expanded view can't carry (a one-to-many table doesn't
 * flatten onto a single row), and it's only actually needed by the edit
 * dialog, so a small extra query per page is fine.
 */
async function attachVatLines(
  supabase: SupabaseClient,
  transactions: Transaction[]
): Promise<Transaction[]> {
  const ids = transactions.map((t) => t.id);
  if (ids.length === 0) return transactions;

  const { data, error } = await supabase
    .from("transaction_vat_lines")
    .select("transaction_id, net, vat_rate_id")
    .in("transaction_id", ids)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const byTransaction = new Map<string, { net: string; vat_rate_id: string | null }[]>();
  for (const row of data ?? []) {
    const list = byTransaction.get(row.transaction_id) ?? [];
    list.push({ net: row.net, vat_rate_id: row.vat_rate_id });
    byTransaction.set(row.transaction_id, list);
  }

  return transactions.map((t) => ({ ...t, vatLines: byTransaction.get(t.id) ?? [] }));
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
  if (filters.invoiceDateFrom) {
    query = query.gte("invoice_date", filters.invoiceDateFrom);
  }
  if (filters.invoiceDateTo) {
    query = query.lte("invoice_date", filters.invoiceDateTo);
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

  query = query.order(SORT_COLUMN[sort] ?? "date", { ascending: dir === "asc" });
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
    transactions: await attachVatLines(supabase, (data ?? []).map(toTransaction)),
    totalCount: count ?? 0,
  };
}

export type WalletTransactionFilters = Omit<TransactionFilters, "walletId"> & {
  balanceMin?: number;
  balanceMax?: number;
};

export type WalletTransactionListParams = {
  filters?: WalletTransactionFilters;
  sort?: SortKey;
  dir?: SortDir;
  page?: number;
  pageSize?: number;
  /** The wallet's starting_balance — the running balance walk seeds from this instead of 0. Defaults to 0 if omitted. */
  startingBalance?: number;
};

/**
 * "Balance view" (2026-07) — the Transactions page's replacement for what
 * used to be a separate `/wallets/[id]` ledger page: press "Balance view",
 * pick a wallet, and this same table narrows to just that wallet's
 * transactions with a running Balance column swapped in for the (now
 * redundant) Wallet column — everything else about the table (Net/VAT/
 * Total columns, filters, sorting, row actions) stays exactly as it is
 * everywhere else, since it's still `TransactionRow`/`TransactionTableHeader`
 * rendering it, just with `balanceMode` on.
 *
 * The running balance has to be computed over the wallet's *complete*
 * active history first, walked chronologically — sorting/filtering by
 * anything other than date would otherwise produce a wrong (or at least
 * meaningless) balance for later rows, since each one depends on knowing
 * about every row before it. So, same as the old wallet ledger this
 * replaces: fetch everything for this wallet unfiltered, compute the
 * running balance, and only *then* apply filters/sort/pagination to the
 * already-computed list, entirely in JS — this can't be pushed down into
 * the database the way getActiveTransactions is, for the same reason.
 */
export async function getWalletTransactionsWithBalance(
  supabase: SupabaseClient,
  walletId: string,
  params: WalletTransactionListParams = {}
): Promise<TransactionListResult> {
  const filters = params.filters ?? {};
  const sort = params.sort ?? "date";
  const dir = params.dir ?? "asc";
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  const { data, error } = await supabase
    .from("transactions_expanded")
    .select("*")
    .eq("is_deleted", false)
    .or(`wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<TransactionsExpandedRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  let running = params.startingBalance ?? 0;
  const allWithBalance: Transaction[] = (data ?? []).map((row) => {
    const transaction = toTransaction(row);
    let amount: number;
    if (transaction.type === "transfer") {
      const isFromSide = row.wallet_id === walletId;
      amount = isFromSide ? -Number(transaction.net) : Number(transaction.net);
    } else {
      const total = computeTotal(transaction.net, transaction.vat_amount);
      amount = transaction.type === "income" ? total : -total;
    }
    running += amount;
    return { ...transaction, runningBalance: running };
  });

  let filtered = allWithBalance;
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    filtered = filtered.filter((t) => t.description.toLowerCase().includes(needle));
  }
  if (filters.type) {
    filtered = filtered.filter((t) => t.type === filters.type);
  }
  if (filters.entityId) {
    filtered = filtered.filter((t) => t.entity?.id === filters.entityId);
  }
  if (filters.categoryId) {
    filtered = filtered.filter((t) => t.category?.id === filters.categoryId);
  }
  if (filters.dateFrom) {
    filtered = filtered.filter((t) => t.date >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    filtered = filtered.filter((t) => t.date <= filters.dateTo!);
  }
  if (filters.invoiceDateFrom) {
    filtered = filtered.filter((t) => t.invoice_date >= filters.invoiceDateFrom!);
  }
  if (filters.invoiceDateTo) {
    filtered = filtered.filter((t) => t.invoice_date <= filters.invoiceDateTo!);
  }
  if (filters.netMin !== undefined) {
    filtered = filtered.filter((t) => Number(t.net) >= filters.netMin!);
  }
  if (filters.netMax !== undefined) {
    filtered = filtered.filter((t) => Number(t.net) <= filters.netMax!);
  }
  if (filters.vatAmountMin !== undefined) {
    filtered = filtered.filter((t) => Number(t.vat_amount) >= filters.vatAmountMin!);
  }
  if (filters.vatAmountMax !== undefined) {
    filtered = filtered.filter((t) => Number(t.vat_amount) <= filters.vatAmountMax!);
  }
  if (filters.totalMin !== undefined) {
    filtered = filtered.filter(
      (t) => computeTotal(t.net, t.vat_amount) >= filters.totalMin!
    );
  }
  if (filters.totalMax !== undefined) {
    filtered = filtered.filter(
      (t) => computeTotal(t.net, t.vat_amount) <= filters.totalMax!
    );
  }
  if (filters.balanceMin !== undefined) {
    filtered = filtered.filter((t) => (t.runningBalance ?? 0) >= filters.balanceMin!);
  }
  if (filters.balanceMax !== undefined) {
    filtered = filtered.filter((t) => (t.runningBalance ?? 0) <= filters.balanceMax!);
  }

  // Array.prototype.sort is stable (ES2019+), so entries that tie on the
  // chosen key keep their original chronological order.
  const sorted = [...filtered].sort((a, b) => {
    let cmp: number;
    switch (sort) {
      case "type":
        cmp = a.type.localeCompare(b.type);
        break;
      case "category":
        cmp = (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
        break;
      case "entity":
        cmp = (a.entity?.name ?? "").localeCompare(b.entity?.name ?? "");
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
      case "net":
        cmp = Number(a.net) - Number(b.net);
        break;
      case "vat_amount":
        cmp = Number(a.vat_amount) - Number(b.vat_amount);
        break;
      case "total":
        cmp = computeTotal(a.net, a.vat_amount) - computeTotal(b.net, b.vat_amount);
        break;
      case "balance":
        cmp = (a.runningBalance ?? 0) - (b.runningBalance ?? 0);
        break;
      default:
        cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    }
    return dir === "asc" ? cmp : -cmp;
  });

  const totalCount = sorted.length;
  const from = (page - 1) * pageSize;
  const transactions = sorted.slice(from, from + pageSize);

  return { transactions: await attachVatLines(supabase, transactions), totalCount };
}
