import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TablePagination } from "@/components/table/pagination";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseNumberParam } from "@/lib/parse-params";
import { WALLET_LEDGER_SORT_KEYS, getWalletLedger } from "../queries";
import { getActiveEntities } from "../../entities/queries";
import { getActiveCategories } from "../../lists/categories/queries";
import type { TransactionType } from "../../transactions/queries";
import { WalletLedgerTableHeader } from "./wallet-ledger-table-header";
import { WalletLedgerRow } from "./wallet-ledger-row";

const PAGE_SIZE = 25;
const TRANSACTION_TYPES: TransactionType[] = ["income", "expense", "transfer"];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function WalletLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id, name")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (!wallet) {
    notFound();
  }

  const rawParams = await searchParams;
  const search = getParam(rawParams, "q")?.trim();
  const typeParam = getParam(rawParams, "type");
  const type =
    typeParam && TRANSACTION_TYPES.includes(typeParam as TransactionType)
      ? (typeParam as TransactionType)
      : undefined;
  const entityParam = getParam(rawParams, "entity");
  const entityId = entityParam && UUID_RE.test(entityParam) ? entityParam : undefined;
  const categoryParam = getParam(rawParams, "category");
  const categoryId = categoryParam && UUID_RE.test(categoryParam) ? categoryParam : undefined;
  const fromParam = getParam(rawParams, "from");
  const toParam = getParam(rawParams, "to");
  const dateFrom = fromParam && DATE_RE.test(fromParam) ? fromParam : undefined;
  const dateTo = toParam && DATE_RE.test(toParam) ? toParam : undefined;
  const amountMin = parseNumberParam(getParam(rawParams, "amount_min"));
  const amountMax = parseNumberParam(getParam(rawParams, "amount_max"));
  const balanceMin = parseNumberParam(getParam(rawParams, "balance_min"));
  const balanceMax = parseNumberParam(getParam(rawParams, "balance_max"));
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    WALLET_LEDGER_SORT_KEYS
  );

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const ledgerParams = {
    search,
    type,
    entityId,
    categoryId,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    balanceMin,
    balanceMax,
    sort,
    dir,
    pageSize: PAGE_SIZE,
  };
  const [ledgerResult, { data: entities }, { data: categories }] = await Promise.all([
    getWalletLedger(supabase, id, { ...ledgerParams, page: requestedPage }),
    getActiveEntities(supabase),
    getActiveCategories(supabase),
  ]);
  let { entries, totalCount } = ledgerResult;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  if (requestedPage > totalPages) {
    page = totalPages;
    ({ entries, totalCount } = await getWalletLedger(supabase, id, {
      ...ledgerParams,
      page,
    }));
  }

  const hasActiveFilters = Boolean(
    search ||
      type ||
      entityId ||
      categoryId ||
      dateFrom ||
      dateTo ||
      amountMin !== undefined ||
      amountMax !== undefined ||
      balanceMin !== undefined ||
      balanceMax !== undefined
  );

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div className="space-y-3">
        <Link
          href="/wallets"
          className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
        >
          ← Wallets
        </Link>
        <ListPageHeader
          title={wallet.name}
          searchPlaceholder="Search description…"
          showDateRange
        />
      </div>

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <WalletLedgerTableHeader entities={entities ?? []} categories={categories ?? []} />
            <tbody>
              {entries.map((e) => (
                <WalletLedgerRow key={e.id} entry={e} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {hasActiveFilters
                      ? "No transactions match these filters."
                      : "No transactions for this wallet yet."}
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
