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
