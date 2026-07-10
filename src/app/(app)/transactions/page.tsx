import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
import {
  getActiveTransactions,
  SORT_KEYS,
  type TransactionFilters,
  type TransactionType,
} from "./queries";
import { getActiveEntities } from "../entities/queries";
import { getActiveCategories } from "../lists/categories/queries";
import { getActiveWallets } from "../wallets/queries";
import { getActiveVatRates } from "../lists/vat-rates/vat-rate-queries";
import { TransactionModal } from "./transaction-modal";
import { TransactionRow } from "./transaction-row";
import { TransactionTableHeader } from "./transaction-table-header";
import { TablePagination } from "@/components/table/pagination";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseNumberParam } from "@/lib/parse-params";

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
  const category = getParam(searchParams, "category");
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
    categoryId: category && UUID_RE.test(category) ? category : undefined,
    dateFrom: from && DATE_RE.test(from) ? from : undefined,
    dateTo: to && DATE_RE.test(to) ? to : undefined,
    netMin: parseNumberParam(getParam(searchParams, "net_min")),
    netMax: parseNumberParam(getParam(searchParams, "net_max")),
    vatAmountMin: parseNumberParam(getParam(searchParams, "vat_amount_min")),
    vatAmountMax: parseNumberParam(getParam(searchParams, "vat_amount_max")),
    totalMin: parseNumberParam(getParam(searchParams, "total_min")),
    totalMax: parseNumberParam(getParam(searchParams, "total_max")),
  };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const filters = parseFilters(rawParams);
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    SORT_KEYS
  );
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined
  );

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [
    transactionsResult,
    { data: entities },
    { data: categories },
    { data: wallets },
    { data: vatRates },
  ] = await Promise.all([
    getActiveTransactions(supabase, {
      filters,
      sort,
      dir,
      page: requestedPage,
      pageSize: PAGE_SIZE,
    }),
    getActiveEntities(supabase),
    getActiveCategories(supabase),
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
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Transactions"
        searchPlaceholder="Search description…"
        showDateRange
        addButton={
          <TransactionModal
            trigger="Add transaction"
            title="Add transaction"
            submitLabel="Add"
            entities={entities ?? []}
            categories={categories ?? []}
            wallets={wallets ?? []}
            vatRates={vatRates ?? []}
            action={addTransaction}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TransactionTableHeader
              entities={entities ?? []}
              categories={categories ?? []}
              wallets={wallets ?? []}
            />
            <tbody>
              {transactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  entities={entities ?? []}
                  categories={categories ?? []}
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
