import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFinance } from "../require-access";
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
import { getActiveCategories } from "../settings/categories/queries";
import { getActiveWallets } from "../wallets/queries";
import { getActiveVatRates } from "../settings/vat-rates/vat-rate-queries";
import { getActiveWithheldTaxRates } from "../settings/withheld-tax-rates/withheld-tax-rate-queries";
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
  await requireFinance();
  const supabase = await createClient();
  const rawParams = await searchParams;
  const params = toSearchParams(rawParams);
  const searchParamsString = params.toString();

  // Default the view to the current month when the visitor hasn't chosen any
  // period. Redirecting (rather than defaulting the query silently) keeps the
  // URL the single source of truth, so the date-range filter shows "This
  // month" active and its from/to fields are populated. Skipped whenever a
  // period intent is already present — a from/to range, a Taxes invoice-date
  // drill-down (invoice_from/invoice_to), or an explicit "All time" (all=1) —
  // so those deep-links and the opt-out aren't clobbered. Balance view is
  // excluded too — its running-balance ledger is meant to show full history,
  // not a single month.
  const hasPeriodIntent = ["from", "to", "invoice_from", "invoice_to", "all", "balance"].some(
    (k) => params.has(k)
  );
  if (!hasPeriodIntent) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, "0");
    const lastDay = new Date(y, m + 1, 0).getDate();
    const withMonth = new URLSearchParams(searchParamsString);
    withMonth.set("from", `${y}-${pad(m + 1)}-01`);
    withMonth.set("to", `${y}-${pad(m + 1)}-${pad(lastDay)}`);
    redirect(`/transactions?${withMonth.toString()}`);
  }

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
    { data: withheldRates },
  ] = await Promise.all([
    fetchFirstSpan(),
    getActiveEntities(supabase),
    getActiveCategories(supabase),
    getActiveVatRates(supabase),
    getActiveWithheldTaxRates(supabase),
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
        searchPlaceholder="Search description or entity…"
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
              withheldRates={withheldRates ?? []}
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
              withheldRates={withheldRates ?? []}
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
