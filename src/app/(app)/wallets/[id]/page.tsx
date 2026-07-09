import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TablePagination } from "@/components/table/pagination";
import { ListPageHeader } from "@/components/table/list-page-header";
import {
  WALLET_LEDGER_SORT_KEYS,
  getWalletLedger,
  type WalletLedgerSortDir,
  type WalletLedgerSortKey,
} from "../queries";
import type { TransactionType } from "../../transactions/queries";
import { WalletLedgerTableHeader } from "./wallet-ledger-table-header";
import { WalletLedgerRow } from "./wallet-ledger-row";

const PAGE_SIZE = 25;
const TRANSACTION_TYPES: TransactionType[] = ["income", "expense", "transfer"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function parseSort(searchParams: RawSearchParams): {
  sort: WalletLedgerSortKey;
  dir: WalletLedgerSortDir;
} {
  const sortParam = getParam(searchParams, "sort");
  const sort = WALLET_LEDGER_SORT_KEYS.includes(sortParam as WalletLedgerSortKey)
    ? (sortParam as WalletLedgerSortKey)
    : "date";
  const dir: WalletLedgerSortDir = getParam(searchParams, "dir") === "desc" ? "desc" : "asc";
  return { sort, dir };
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
  const fromParam = getParam(rawParams, "from");
  const toParam = getParam(rawParams, "to");
  const dateFrom = fromParam && DATE_RE.test(fromParam) ? fromParam : undefined;
  const dateTo = toParam && DATE_RE.test(toParam) ? toParam : undefined;
  const { sort, dir } = parseSort(rawParams);

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const ledgerParams = { search, type, dateFrom, dateTo, sort, dir, pageSize: PAGE_SIZE };
  let { entries, totalCount } = await getWalletLedger(supabase, id, {
    ...ledgerParams,
    page: requestedPage,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  if (requestedPage > totalPages) {
    page = totalPages;
    ({ entries, totalCount } = await getWalletLedger(supabase, id, {
      ...ledgerParams,
      page,
    }));
  }

  const hasActiveFilters = Boolean(search || type || dateFrom || dateTo);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
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
            <WalletLedgerTableHeader />
            <tbody>
              {entries.map((e) => (
                <WalletLedgerRow key={e.id} entry={e} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-faint">
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
