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

export type WalletSortKey = "name" | "balance";
export type WalletSortDir = "asc" | "desc";

export const WALLET_SORT_KEYS: WalletSortKey[] = ["name", "balance"];

export type WalletListParams = {
  search?: string;
  sort?: WalletSortKey;
  dir?: WalletSortDir;
  balanceMin?: number;
  balanceMax?: number;
  page?: number;
  pageSize?: number;
};

export type WalletListResult = {
  wallets: (Wallet & { balance: number })[];
  totalCount: number;
};

/** Escapes ILIKE's wildcard characters so a literal "%" or "_" in a search term isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

/**
 * The Wallets page's own list view: search + sort + pagination, part of
 * the shared table template (src/components/table/). Unlike Entities/VAT
 * rates, sorting and pagination both happen here in JS rather than at the
 * database level — Balance isn't a stored column (see getWalletBalances
 * above), so there's no DB column to sort by when the user sorts by
 * Balance. Rather than switch between a DB-paginated path (sort by Name)
 * and a JS-paginated one (sort by Balance) depending on which column is
 * active, this always fetches every matching wallet, computes balances,
 * sorts, and paginates in memory — one code path for every sort key.
 * Justified because a user's wallet list is inherently tiny (a handful of
 * accounts), so this has no real performance cost, unlike Transactions.
 */
export async function getWalletsList(
  supabase: SupabaseClient,
  params: WalletListParams = {}
): Promise<WalletListResult> {
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  let query = supabase.from("wallets").select("id, name").eq("is_deleted", false);
  if (params.search) {
    query = query.ilike("name", `%${escapeLikePattern(params.search)}%`);
  }

  const [{ data, error }, balances] = await Promise.all([
    query.returns<Wallet[]>(),
    getWalletBalances(supabase),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  let withBalance = (data ?? []).map((w) => ({
    ...w,
    balance: balances.get(w.id) ?? 0,
  }));

  if (params.balanceMin !== undefined) {
    withBalance = withBalance.filter((w) => w.balance >= params.balanceMin!);
  }
  if (params.balanceMax !== undefined) {
    withBalance = withBalance.filter((w) => w.balance <= params.balanceMax!);
  }

  withBalance.sort((a, b) => {
    const cmp =
      sort === "balance" ? a.balance - b.balance : a.name.localeCompare(b.name);
    return dir === "asc" ? cmp : -cmp;
  });

  const totalCount = withBalance.length;
  const from = (page - 1) * pageSize;
  const wallets = withBalance.slice(from, from + pageSize);

  return { wallets, totalCount };
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
  entityId: string | null;
  /**
   * The Entity column's display value: the actual entity name for
   * income/expense, or the counterparty wallet (arrowed toward/away from
   * this wallet) for a transfer — this page has no separate Wallet column
   * (it's already scoped to one wallet), so this is where that "other
   * side" information now lives once the Type column became icon-only.
   */
  entityName: string | null;
  categoryId: string | null;
  categoryName: string | null;
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
  wallet_name: string | null;
  to_wallet_id: string | null;
  to_wallet_name: string | null;
  entity_id: string | null;
  entity_name: string | null;
  category_id: string | null;
  category_name: string | null;
};

export type WalletLedgerSortKey =
  | "date"
  | "category"
  | "entity"
  | "description"
  | "type"
  | "amount"
  | "balance";
export type WalletLedgerSortDir = "asc" | "desc";

export const WALLET_LEDGER_SORT_KEYS: WalletLedgerSortKey[] = [
  "date",
  "category",
  "entity",
  "description",
  "type",
  "amount",
  "balance",
];

export type WalletLedgerParams = {
  search?: string;
  type?: TransactionType;
  entityId?: string;
  categoryId?: string;
  /** Inclusive, ISO "yyyy-mm-dd". */
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  balanceMin?: number;
  balanceMax?: number;
  sort?: WalletLedgerSortKey;
  dir?: WalletLedgerSortDir;
  page?: number;
  pageSize?: number;
};

export type WalletLedgerResult = {
  entries: WalletLedgerEntry[];
  totalCount: number;
};

/**
 * A wallet's transactions with a running balance attached to each one,
 * computed by walking the ledger in chronological order (oldest-first, to
 * match the rest of the app's display convention) — this part must
 * always run over the wallet's *complete* active history before any
 * filter is applied, or every later row's cumulative balance would be
 * wrong (it would be missing the transactions that produced its opening
 * balance). Search/type/date-range filtering, sorting, and pagination are
 * applied only after, to the already-computed list, for display —
 * intentionally never pushed into the initial database query. Don't
 * "simplify" this by moving a filter into the query below.
 *
 * Queries `transactions_expanded` scoped to this wallet via
 * `.or(wallet_id.eq / to_wallet_id.eq)` — the same idiom
 * transactions/queries.ts's getActiveTransactions uses for its Wallet
 * filter — rather than fetching every one of the user's transactions and
 * filtering in JS, which the previous version of this function did.
 */
export async function getWalletLedger(
  supabase: SupabaseClient,
  walletId: string,
  params: WalletLedgerParams = {}
): Promise<WalletLedgerResult> {
  const { data, error } = await supabase
    .from("transactions_expanded")
    .select(
      "id, date, description, type, net, vat_amount, wallet_id, wallet_name, to_wallet_id, to_wallet_name, entity_id, entity_name, category_id, category_name"
    )
    .eq("is_deleted", false)
    .or(`wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<WalletLedgerRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  let running = 0;
  const allEntries: WalletLedgerEntry[] = (data ?? []).map((row) => {
    let amount: number;
    let fromWalletName: string | null = null;
    let toWalletName: string | null = null;
    let entityName: string | null;

    if (row.type === "transfer") {
      const isFromSide = row.wallet_id === walletId;
      amount = isFromSide ? -Number(row.net) : Number(row.net);
      fromWalletName = row.wallet_name;
      toWalletName = row.to_wallet_name;
      entityName = isFromSide
        ? `→ ${row.to_wallet_name ?? "—"}`
        : `← ${row.wallet_name ?? "—"}`;
    } else {
      const total = computeTotal(row.net, row.vat_amount);
      amount = row.type === "income" ? total : -total;
      entityName = row.entity_name;
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
      entityId: row.entity_id,
      entityName,
      categoryId: row.category_id,
      categoryName: row.category_name,
      runningBalance: running,
    };
  });

  let filtered = allEntries;
  const search = params.search?.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter((e) => e.description.toLowerCase().includes(search));
  }
  if (params.type) {
    filtered = filtered.filter((e) => e.type === params.type);
  }
  if (params.entityId) {
    filtered = filtered.filter((e) => e.entityId === params.entityId);
  }
  if (params.categoryId) {
    filtered = filtered.filter((e) => e.categoryId === params.categoryId);
  }
  if (params.dateFrom) {
    filtered = filtered.filter((e) => e.date >= params.dateFrom!);
  }
  if (params.dateTo) {
    filtered = filtered.filter((e) => e.date <= params.dateTo!);
  }
  if (params.amountMin !== undefined) {
    filtered = filtered.filter((e) => e.amount >= params.amountMin!);
  }
  if (params.amountMax !== undefined) {
    filtered = filtered.filter((e) => e.amount <= params.amountMax!);
  }
  if (params.balanceMin !== undefined) {
    filtered = filtered.filter((e) => e.runningBalance >= params.balanceMin!);
  }
  if (params.balanceMax !== undefined) {
    filtered = filtered.filter((e) => e.runningBalance <= params.balanceMax!);
  }

  const sort = params.sort ?? "date";
  const dir = params.dir ?? "asc";
  // Array.prototype.sort is stable (ES2019+), so entries that tie on the
  // chosen key keep their original chronological order.
  const sorted = [...filtered].sort((a, b) => {
    let cmp: number;
    switch (sort) {
      case "category":
        cmp = (a.categoryName ?? "").localeCompare(b.categoryName ?? "");
        break;
      case "entity":
        cmp = (a.entityName ?? "").localeCompare(b.entityName ?? "");
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
      case "type":
        cmp = a.type.localeCompare(b.type);
        break;
      case "amount":
        cmp = a.amount - b.amount;
        break;
      case "balance":
        cmp = a.runningBalance - b.runningBalance;
        break;
      default:
        cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    }
    return dir === "asc" ? cmp : -cmp;
  });

  const totalCount = sorted.length;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const entries = sorted.slice(from, from + pageSize);

  return { entries, totalCount };
}
