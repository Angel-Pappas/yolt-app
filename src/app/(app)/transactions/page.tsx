import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
import {
  getActiveTransactions,
  getWalletTransactionsWithBalance,
  type TransactionListResult,
} from "./queries";
import {
  hasActiveTransactionFilters,
  parseTransactionListQuery,
  toBalanceViewFilters,
  TRANSACTION_PAGE_SIZE,
} from "./list-params";
import { getActiveEntities } from "../entities/queries";
import { getActiveCategories } from "../lists/categories/queries";
import { getActiveWallets } from "../wallets/queries";
import { getActiveVatRates } from "../lists/vat-rates/vat-rate-queries";
import { TransactionModal } from "./transaction-modal";
import { TransactionRows } from "./transaction-rows";
import { TransactionTableHeader } from "./transaction-table-header";
import { BalanceViewControl } from "./balance-view-control";
import { TransactionQuickFilters } from "./quick-filter-buttons";
import { ImportTransactionsModal } from "./import/import-modal";
import { ListPageHeader } from "@/components/table/list-page-header";

/** Type, Date, Wallet-or-Balance, Category, Entity, Description, Net, VAT, Total, actions. Balance view swaps Wallet for Balance, so the count is the same either way. */
const COLUMN_COUNT = 10;

type RawSearchParams = Record<string, string | string[] | undefined>;

/** A repeated param (`?type=a&type=b`) is meaningless for every filter here, so only single string values are taken — matching how these were always read. */
function toSearchParams(raw: RawSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const params = toSearchParams(rawParams);
  const searchParamsString = params.toString();
  const query = parseTransactionListQuery(params);

  // Wallets are needed up front to resolve the `balance` param into a real
  // wallet before we can decide which query pipeline to use below, so this
  // one is fetched ahead of the rest rather than joining the Promise.all.
  const { data: wallets } = await getActiveWallets(supabase);
  const balanceWallet = query.balanceWalletId
    ? (wallets ?? []).find((w) => w.id === query.balanceWalletId) ?? null
    : null;

  // "Balance view" (see balance-view-control.tsx): pinned to one wallet, no
  // Wallet column/filter (the list is already scoped to it), running
  // balance computed in JS over that wallet's complete history — see
  // getWalletTransactionsWithBalance for why that can't be pushed into the
  // database the way the normal path is.
  function fetchFirstSpan(): Promise<TransactionListResult> {
    if (balanceWallet) {
      return getWalletTransactionsWithBalance(supabase, balanceWallet.id, {
        filters: toBalanceViewFilters(query),
        sort: query.sort,
        dir: query.dir,
        offset: 0,
        limit: TRANSACTION_PAGE_SIZE,
        startingBalance: Number(balanceWallet.starting_balance),
      });
    }
    return getActiveTransactions(supabase, {
      filters: query.filters,
      sort: query.sort,
      dir: query.dir,
      offset: 0,
      limit: TRANSACTION_PAGE_SIZE,
    });
  }

  const [
    { transactions, totalCount },
    { data: entities },
    { data: categories },
    { data: vatRates },
  ] = await Promise.all([
    fetchFirstSpan(),
    getActiveEntities(supabase),
    getActiveCategories(supabase),
    getActiveVatRates(supabase),
  ]);

  const emptyMessage = hasActiveTransactionFilters(query)
    ? "No transactions match these filters."
    : balanceWallet
      ? `No transactions for ${balanceWallet.name} yet.`
      : "No transactions yet.";

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Transactions"
        searchPlaceholder="Search description…"
        showDateRange
        dateRangeExtra={<TransactionQuickFilters />}
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
            {/*
              Keyed on the full querystring so any filter/sort/view change
              remounts the list and drops the rows accumulated by scrolling
              — the server has just rendered a fresh first span under the
              new query, and that becomes the new starting point.
            */}
            <TransactionRows
              key={searchParamsString}
              initialTransactions={transactions}
              totalCount={totalCount}
              pageSize={TRANSACTION_PAGE_SIZE}
              searchParamsString={searchParamsString}
              entities={entities ?? []}
              categories={categories ?? []}
              wallets={wallets ?? []}
              vatRates={vatRates ?? []}
              balanceMode={balanceWallet !== null}
              columnCount={COLUMN_COUNT}
              emptyMessage={emptyMessage}
            />
          </table>
        </div>
      </div>
    </div>
  );
}
