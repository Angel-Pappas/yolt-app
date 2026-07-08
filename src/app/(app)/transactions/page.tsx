import { createClient } from "@/lib/supabase/server";
import { computeTotal, formatAmount } from "@/lib/format";
import { addTransaction } from "./actions";
import {
  getActiveTransactions,
  type TransactionFilters,
  type TransactionType,
} from "./queries";
import { getActiveEntities } from "../entities/queries";
import { getActiveWallets } from "../wallets/queries";
import { getActiveVatRates } from "../options/vat-rate-queries";
import { TransactionModal } from "./transaction-modal";
import { TransactionRow } from "./transaction-row";
import { TransactionFiltersBar } from "./transaction-filters-bar";

const TRANSACTION_TYPES: TransactionType[] = ["income", "expense", "transfer"];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Validates raw URL search params before they ever reach the Supabase
 * query — an invalid UUID/date/type passed straight to .eq/.or on a
 * typed column would error the whole query out, not just match nothing.
 * Anything that doesn't validate is silently dropped (treated as "no
 * filter"), same spirit as ignoring a malformed query string.
 */
function parseFilters(searchParams: RawSearchParams): TransactionFilters {
  const get = (key: string): string | undefined => {
    const value = searchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  const search = get("q")?.trim();
  const type = get("type");
  const entity = get("entity");
  const wallet = get("wallet");
  const vat = get("vat");
  const from = get("from");
  const to = get("to");

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

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const filters = parseFilters(rawParams);
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

  const totals = (transactions ?? []).reduce(
    (acc, t) => {
      acc.net += Number(t.net);
      acc.vat += Number(t.vat_amount);
      acc.total += computeTotal(t.net, t.vat_amount);
      return acc;
    },
    { net: 0, vat: 0, total: 0 }
  );
  const count = transactions?.length ?? 0;

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

      <TransactionFiltersBar
        entities={entities ?? []}
        wallets={wallets ?? []}
        vatRates={vatRates ?? []}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-neutral-50 px-4 py-2 text-sm">
        <span className="text-neutral-500">
          {count} transaction{count === 1 ? "" : "s"}
        </span>
        <div className="flex gap-4">
          <span className="text-neutral-500">
            Net: {formatAmount(totals.net)}
          </span>
          <span className="text-neutral-500">
            VAT: {formatAmount(totals.vat)}
          </span>
          <span className="font-semibold">
            Total: {formatAmount(totals.total)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Date</th>
              <th className="py-2">Type</th>
              <th className="py-2">Entity</th>
              <th className="py-2">Wallet</th>
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Net</th>
              <th className="py-2 text-right">VAT</th>
              <th className="py-2 text-right">VAT Amount</th>
              <th className="py-2 text-right">Total</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                entities={entities ?? []}
                wallets={wallets ?? []}
                vatRates={vatRates ?? []}
              />
            ))}
            {count === 0 && (
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
    </div>
  );
}
