import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
import {
  getActiveTransactions,
  SORT_KEYS,
  type SortDir,
  type SortKey,
  type TransactionFilters,
  type TransactionType,
} from "./queries";
import { getActiveEntities } from "../entities/queries";
import { getActiveWallets } from "../wallets/queries";
import { getActiveVatRates } from "../options/vat-rate-queries";
import { TransactionModal } from "./transaction-modal";
import { TransactionRow } from "./transaction-row";
import { TransactionFiltersBar } from "./transaction-filters-bar";
import { TransactionTableHeader } from "./transaction-table-header";
import { TablePagination } from "@/components/table/pagination";

const TRANSACTION_TYPES: TransactionType[] = ["income", "expense", "transfer"];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PAGE_SIZE = 25;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Validates raw URL search params before they ever reach the Supabase
 * query — an invalid UUID/date/type passed straight to .eq/.or on a
 * typed column would error the whole query out, not just match nothing.
 * Anything that doesn't validate is silently dropped (treated as "no
 * filter"), same spirit as ignoring a malformed query string.
 */
function parseFilters(searchParams: RawSearchParams): TransactionFilters {
  const search = getParam(searchParams, "q")?.trim();
  const type = getParam(searchParams, "type");
  const entity = getParam(searchParams, "entity");
  const wallet = getParam(searchParams, "wallet");
  const vat = getParam(searchParams, "vat");
  const from = getParam(searchParams, "from");
  const to = getParam(searchParams, "to");

  return {
    search: search || undefined,
    type:
      type && TRANSACTION_TYPES.includes(type as TransactionType)
        ? (type as TransactionType)
        : undefined,
    entityId: entity && UUID_RE.test(entity) ? entity : undefined,
    walletId: wallet && UUID_RE.test(wallet) ? wallet : undefined,
    vatRateId: vat && UUID_RE.test(vat) ? vat : undefined,
    dateFrom: from && DATE_RE.test(from) ? from : undefined,
    dateTo: to && DATE_RE.test(to) ? to : undefined,
  };
}

function parseSort(searchParams: RawSearchParams): { sort: SortKey; dir: SortDir } {
  const sortParam = getParam(searchParams, "sort");
  const sort = SORT_KEYS.includes(sortParam as SortKey)
    ? (sortParam as SortKey)
    : "date";
  const dir: SortDir = getParam(searchParams, "dir") === "desc" ? "desc" : "asc";
  return { sort, dir };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const filters = parseFilters(rawParams);
  const { sort, dir } = parseSort(rawParams);
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined
  );

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [transactionsResult, { data: entities }, { data: wallets }, { data: vatRates }] =
    await Promise.all([
      getActiveTransactions(supabase, {
        filters,
        sort,
        dir,
        page: requestedPage,
        pageSize: PAGE_SIZE,
      }),
      getActiveEntities(supabase),
      getActiveWallets(supabase),
      getActiveVatRates(supabase),
    ]);

  let { transactions, totalCount } = transactionsResult;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  // Filters can shrink the result set out from under whatever page the
  // URL asked for (e.g. narrowing a filter while on page 3) — .range()
  // just returns an empty array rather than erroring, so re-fetch
  // clamped to the last valid page instead of showing a confusing blank
  // page with "Page 3 of 1".
  if (requestedPage > totalPages) {
    page = totalPages;
    ({ transactions, totalCount } = await getActiveTransactions(supabase, {
      filters,
      sort,
      dir,
      page,
      pageSize: PAGE_SIZE,
    }));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {totalCount} transaction{totalCount === 1 ? "" : "s"}
          </p>
        </div>
        <TransactionModal
          trigger="Add transaction"
          title="Add transaction"
          submitLabel="Add"
          entities={entities ?? []}
          wallets={wallets ?? []}
          vatRates={vatRates ?? []}
          action={addTransaction}
        />
      </div>

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <TransactionFiltersBar />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TransactionTableHeader
              entities={entities ?? []}
              wallets={wallets ?? []}
              vatRates={vatRates ?? []}
            />
            <tbody>
              {transactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  entities={entities ?? []}
                  wallets={wallets ?? []}
                  vatRates={vatRates ?? []}
                />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {hasActiveFilters
                      ? "No transactions match these filters."
                      : "No transactions yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination page={page} totalPages={totalPages} />
    </div>
  );
}
