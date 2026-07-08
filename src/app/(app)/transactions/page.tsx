import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
import {
  getActiveTransactions,
  sortTransactions,
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
import { TransactionPagination } from "./transaction-pagination";

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

  const [
    { data: transactions },
    { data: entities },
    { data: wallets },
    { data: vatRates },
  ] = await Promise.all([
    getActiveTransactions(supabase, filters),
    getActiveEntities(supabase),
    getActiveWallets(supabase),
    getActiveVatRates(supabase),
  ]);

  const sorted = sortTransactions(transactions ?? [], sort, dir);
  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rawPage = Number(getParam(rawParams, "page"));
  const page =
    Number.isInteger(rawPage) && rawPage >= 1
      ? Math.min(rawPage, totalPages)
      : 1;
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <TransactionModal
          trigger="Add"
          title="Add transaction"
          submitLabel="Add"
          entities={entities ?? []}
          wallets={wallets ?? []}
          vatRates={vatRates ?? []}
          action={addTransaction}
        />
      </div>

      <TransactionFiltersBar />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <TransactionTableHeader
            entities={entities ?? []}
            wallets={wallets ?? []}
            vatRates={vatRates ?? []}
          />
          <tbody>
            {pageItems.map((t) => (
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
                <td colSpan={10} className="py-4 text-center text-neutral-500">
                  {hasActiveFilters
                    ? "No transactions match these filters."
                    : "No transactions yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TransactionPagination page={page} totalPages={totalPages} />
    </div>
  );
}
