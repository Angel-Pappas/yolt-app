import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
import {
  getActiveTransactions,
  getWalletTransactionsWithBalance,
  SORT_KEYS,
  BALANCE_SORT_KEYS,
  type TransactionFilters,
  type TransactionListResult,
  type TransactionType,
  type WalletTransactionFilters,
} from "./queries";
import { getActiveEntities } from "../entities/queries";
import { getActiveCategories } from "../lists/categories/queries";
import { getActiveWallets } from "../wallets/queries";
import { getActiveVatRates } from "../lists/vat-rates/vat-rate-queries";
import { TransactionModal } from "./transaction-modal";
import { TransactionRow } from "./transaction-row";
import { TransactionTableHeader } from "./transaction-table-header";
import { BalanceViewControl } from "./balance-view-control";
import { ImportTransactionsModal } from "./import/import-modal";
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
  const invoiceFrom = getParam(searchParams, "invoice_from");
  const invoiceTo = getParam(searchParams, "invoice_to");

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
    invoiceDateFrom: invoiceFrom && DATE_RE.test(invoiceFrom) ? invoiceFrom : undefined,
    invoiceDateTo: invoiceTo && DATE_RE.test(invoiceTo) ? invoiceTo : undefined,
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

  // Wallets are needed up front to validate the `balance` param (a wallet
  // id) before we can even decide which query function to call below, so
  // this one is fetched ahead of the rest rather than joining the
  // Promise.all with everything else.
  const { data: wallets } = await getActiveWallets(supabase);

  const balanceParam = getParam(rawParams, "balance");
  const balanceWallet =
    balanceParam && UUID_RE.test(balanceParam)
      ? (wallets ?? []).find((w) => w.id === balanceParam) ?? null
      : null;

  const filters = parseFilters(rawParams);
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    balanceWallet ? BALANCE_SORT_KEYS : SORT_KEYS
  );
  const balanceMin = parseNumberParam(getParam(rawParams, "balance_min"));
  const balanceMax = parseNumberParam(getParam(rawParams, "balance_max"));
  const hasActiveFilters =
    Object.values(filters).some((value) => value !== undefined) ||
    balanceMin !== undefined ||
    balanceMax !== undefined;

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  // "Balance view" (see balance-view-control.tsx): pinned to one wallet,
  // no separate Wallet column/filter (the whole list is already scoped to
  // it), running balance computed in JS over that wallet's complete
  // history — see getWalletTransactionsWithBalance for why this can't be
  // pushed down into the database the way the normal path is.
  function fetchPage(page: number): Promise<TransactionListResult> {
    if (balanceWallet) {
      const balanceFilters: WalletTransactionFilters = {
        search: filters.search,
        type: filters.type,
        entityId: filters.entityId,
        categoryId: filters.categoryId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        invoiceDateFrom: filters.invoiceDateFrom,
        invoiceDateTo: filters.invoiceDateTo,
        netMin: filters.netMin,
        netMax: filters.netMax,
        vatAmountMin: filters.vatAmountMin,
        vatAmountMax: filters.vatAmountMax,
        totalMin: filters.totalMin,
        totalMax: filters.totalMax,
        balanceMin,
        balanceMax,
      };
      return getWalletTransactionsWithBalance(supabase, balanceWallet.id, {
        filters: balanceFilters,
        sort,
        dir,
        page,
        pageSize: PAGE_SIZE,
      });
    }
    return getActiveTransactions(supabase, { filters, sort, dir, page, pageSize: PAGE_SIZE });
  }

  const [transactionsResult, { data: entities }, { data: categories }, { data: vatRates }] =
    await Promise.all([
      fetchPage(requestedPage),
      getActiveEntities(supabase),
      getActiveCategories(supabase),
      getActiveVatRates(supabase),
    ]);

  let { transactions, totalCount } = transactionsResult;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  // Filters can shrink the result set out from under whatever page the
  // URL asked for (e.g. narrowing a filter while on page 3) — re-fetch
  // clamped to the last valid page instead of showing a confusing blank
  // page with "Page 3 of 1".
  if (requestedPage > totalPages) {
    page = totalPages;
    ({ transactions, totalCount } = await fetchPage(page));
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Transactions"
        searchPlaceholder="Search description…"
        showDateRange
        addButton={
          <div className="flex flex-wrap items-center gap-2.5">
            <BalanceViewControl wallets={wallets ?? []} activeWallet={balanceWallet} />
            <ImportTransactionsModal />
            <TransactionModal
              trigger="Add transaction"
              title="Add transaction"
              entities={entities ?? []}
              categories={categories ?? []}
              wallets={wallets ?? []}
              vatRates={vatRates ?? []}
              action={addTransaction}
            />
          </div>
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TransactionTableHeader
              entities={entities ?? []}
              categories={categories ?? []}
              wallets={wallets ?? []}
              balanceMode={balanceWallet !== null}
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
                  balanceMode={balanceWallet !== null}
                />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {hasActiveFilters
                      ? "No transactions match these filters."
                      : balanceWallet
                        ? `No transactions for ${balanceWallet.name} yet.`
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
