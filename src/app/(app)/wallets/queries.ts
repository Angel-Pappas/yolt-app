import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type Wallet = {
  id: string;
  name: string;
  /** The baseline getWalletBalances() adds transaction activity on top of, instead of implicitly starting at zero. Set once at creation but stays an ordinary editable field. */
  starting_balance: string;
};

/**
 * The single place that knows how to fetch a user's non-deleted wallets.
 * See transactions/queries.ts for why filtering is done here and not in
 * the SELECT RLS policy.
 */
export async function getActiveWallets(supabase: TypedSupabaseClient) {
  return supabase
    .from("wallets")
    .select("id, name, starting_balance")
    .eq("is_deleted", false)
    .order("name", { ascending: true })
    .returns<Wallet[]>();
}

type WalletBalanceRow = { wallet_id: string; balance: string };

/**
 * Current balance per wallet: each wallet's `starting_balance` plus every
 * active transaction that touches it. There is still no stored
 * running-balance column — this is recomputed on every read, so it can
 * never drift out of sync when a transaction is edited, deleted, or
 * restored (or when starting_balance itself changes).
 *
 * The arithmetic lives in the `wallet_balances` view (see its migration)
 * rather than here: income adds (net + vat_amount) to its wallet, expense
 * subtracts it, and a transfer subtracts `net` from its "from" wallet
 * while adding it to its "to" wallet. Summing it in SQL rather than
 * streaming every transaction over the wire to reduce it in JS means this
 * returns one row per wallet (a handful) instead of one per transaction
 * (hundreds, and growing), which is what keeps it cheap as history piles
 * up. The view is `security_invoker`, so RLS applies exactly as if the
 * underlying tables were queried directly.
 */
export async function getWalletBalances(
  supabase: TypedSupabaseClient
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("wallet_balances")
    .select("wallet_id, balance")
    .returns<WalletBalanceRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.wallet_id, Number(row.balance)]));
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
  supabase: TypedSupabaseClient,
  params: WalletListParams = {}
): Promise<WalletListResult> {
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";

  let query = supabase
    .from("wallets")
    .select("id, name, starting_balance")
    .eq("is_deleted", false);
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

  return { wallets: withBalance, totalCount: withBalance.length };
}
