import { createClient } from "@/lib/supabase/server";
import { TablePagination } from "@/components/table/pagination";
import { addWallet } from "./actions";
import { WALLET_SORT_KEYS, getWalletsList, type WalletSortDir, type WalletSortKey } from "./queries";
import { WalletModal } from "./wallet-modal";
import { WalletRow } from "./wallet-row";
import { WalletFiltersBar } from "./wallet-filters-bar";
import { WalletTableHeader } from "./wallet-table-header";

const PAGE_SIZE = 25;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function parseSort(searchParams: RawSearchParams): { sort: WalletSortKey; dir: WalletSortDir } {
  const sortParam = getParam(searchParams, "sort");
  const sort = WALLET_SORT_KEYS.includes(sortParam as WalletSortKey)
    ? (sortParam as WalletSortKey)
    : "name";
  const dir: WalletSortDir = getParam(searchParams, "dir") === "desc" ? "desc" : "asc";
  return { sort, dir };
}

export default async function WalletsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const search = getParam(rawParams, "q")?.trim();
  const { sort, dir } = parseSort(rawParams);

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let { wallets, totalCount } = await getWalletsList(supabase, {
    search,
    sort,
    dir,
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  if (requestedPage > totalPages) {
    page = totalPages;
    ({ wallets, totalCount } = await getWalletsList(supabase, {
      search,
      sort,
      dir,
      page,
      pageSize: PAGE_SIZE,
    }));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Wallets</h1>
        <WalletModal
          trigger="Add wallet"
          title="Add wallet"
          submitLabel="Add"
          action={addWallet}
        />
      </div>

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <WalletFiltersBar />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <WalletTableHeader />
            <tbody>
              {wallets.map((w) => (
                <WalletRow key={w.id} wallet={w} balance={w.balance} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {search ? "No wallets match this search." : "No wallets yet."}
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
