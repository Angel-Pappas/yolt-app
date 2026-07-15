import { parseNumberParam } from "@/lib/parse-params";
import { parseSortParam } from "@/components/table/parse-sort-param";
import {
  SORT_KEYS,
  BALANCE_SORT_KEYS,
  type SortDir,
  type SortKey,
  type TransactionFilters,
  type TransactionType,
  type WalletTransactionFilters,
} from "./queries";

const TRANSACTION_TYPES: TransactionType[] = ["income", "expense", "transfer"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** How many rows the Transactions list fetches per request — the first render's worth, and each subsequent chunk as the user scrolls. */
export const TRANSACTION_PAGE_SIZE = 50;

export type TransactionListQuery = {
  filters: TransactionFilters;
  /** Undefined when unsorted — sorting is tri-state (unsorted -> desc -> asc), and unsorted means the query applies its own default order. */
  sort: SortKey | undefined;
  dir: SortDir | undefined;
  /** The wallet id for "balance view", or null for the normal all-wallets list. Validated as a UUID here; whether it's a *real* wallet is resolved against the wallet list by the caller. */
  balanceWalletId: string | null;
  balanceMin?: number;
  balanceMax?: number;
};

/**
 * Turns the Transactions list's URL search params into a validated query.
 *
 * Lives in its own module (rather than inside page.tsx, where it started)
 * because two callers now have to agree on it *exactly*: the page's first
 * render, and `loadMoreTransactions` fetching the next chunk as the user
 * scrolls. Parsing the same querystring through the same function is what
 * guarantees chunk N+1 comes from the same filter set as chunk 1 — if
 * these ever drifted apart, infinite scroll would quietly splice rows from
 * two different queries into one list.
 *
 * Every value is validated (enum / UUID / date shape / number) before it
 * can reach the query. Anything malformed is dropped and treated as "no
 * filter" rather than passed through: an invalid UUID or date handed
 * straight to `.eq`/`.gte` on a typed column errors the whole query out
 * instead of simply matching nothing.
 */
export function parseTransactionListQuery(
  searchParams: URLSearchParams
): TransactionListQuery {
  const get = (key: string) => searchParams.get(key) ?? undefined;

  const search = get("q")?.trim();
  const type = get("type");
  const entity = get("entity");
  const wallet = get("wallet");
  const category = get("category");
  const from = get("from");
  const to = get("to");
  const invoiceFrom = get("invoice_from");
  const invoiceTo = get("invoice_to");
  const balance = get("balance");

  const balanceWalletId = balance && UUID_RE.test(balance) ? balance : null;

  const filters: TransactionFilters = {
    search: search || undefined,
    type:
      type && TRANSACTION_TYPES.includes(type as TransactionType)
        ? (type as TransactionType)
        : undefined,
    entityId: entity && UUID_RE.test(entity) ? entity : undefined,
    walletId: wallet && UUID_RE.test(wallet) ? wallet : undefined,
    categoryId: category && UUID_RE.test(category) ? category : undefined,
    dateFrom: from && DATE_RE.test(from) ? from : undefined,
    dateTo: to && DATE_RE.test(to) ? to : undefined,
    invoiceDateFrom: invoiceFrom && DATE_RE.test(invoiceFrom) ? invoiceFrom : undefined,
    invoiceDateTo: invoiceTo && DATE_RE.test(invoiceTo) ? invoiceTo : undefined,
    netMin: parseNumberParam(get("net_min")),
    netMax: parseNumberParam(get("net_max")),
    vatAmountMin: parseNumberParam(get("vat_amount_min")),
    vatAmountMax: parseNumberParam(get("vat_amount_max")),
    totalMin: parseNumberParam(get("total_min")),
    totalMax: parseNumberParam(get("total_max")),
    unreconciledOnly: get("unreconciled") === "1" || undefined,
    missingInvoiceOnly: get("no_invoice") === "1" || undefined,
  };

  const { sort, dir } = parseSortParam(
    get("sort"),
    get("dir"),
    balanceWalletId ? BALANCE_SORT_KEYS : SORT_KEYS
  );

  return {
    filters,
    sort,
    dir,
    balanceWalletId,
    balanceMin: parseNumberParam(get("balance_min")),
    balanceMax: parseNumberParam(get("balance_max")),
  };
}

/**
 * The same query, shaped for "balance view" (a list pinned to one wallet).
 *
 * The Wallet filter is dropped: the list is already scoped to a single
 * wallet there and the Wallet column isn't even rendered, so a stray
 * `?wallet=` from before entering the view must not narrow it further.
 * The balance range moves in, since that column only exists in this view.
 *
 * Shared by the page's first render and `loadMoreTransactions` so both
 * build the identical filter set — the same reason the parser above is
 * shared, and the thing that stops a scrolled-in chunk from being filtered
 * differently to the rows above it.
 */
export function toBalanceViewFilters(
  query: TransactionListQuery
): WalletTransactionFilters {
  const { walletId, ...rest } = query.filters;
  void walletId;
  return { ...rest, balanceMin: query.balanceMin, balanceMax: query.balanceMax };
}

/** True when any filter is narrowing the list — drives the "no rows match" copy. Sort/balance-view aren't filters. */
export function hasActiveTransactionFilters(query: TransactionListQuery): boolean {
  return (
    Object.values(query.filters).some((value) => value !== undefined) ||
    query.balanceMin !== undefined ||
    query.balanceMax !== undefined
  );
}
