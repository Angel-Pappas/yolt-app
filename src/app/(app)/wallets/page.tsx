import { createClient } from "@/lib/supabase/server";
import { TablePagination } from "@/components/table/pagination";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseNumberParam } from "@/lib/parse-params";
import { addWallet } from "./actions";
import { WALLET_SORT_KEYS, getWalletsList } from "./queries";
import { WalletModal } from "./wallet-modal";
import { WalletRow } from "./wallet-row";
import { WalletTableHeader } from "./wallet-table-header";
import { ListPageHeader } from "@/components/table/list-page-header";

const PAGE_SIZE = 25;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function WalletsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const search = getParam(rawParams, "q")?.trim();
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    WALLET_SORT_KEYS
  );
  const balanceMin = parseNumberParam(getParam(rawParams, "balance_min"));
  const balanceMax = parseNumberParam(getParam(rawParams, "balance_max"));

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const listParams = { search, sort, dir, balanceMin, balanceMax };

  let { wallets, totalCount } = await getWalletsList(supabase, {
    ...listParams,
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  if (requestedPage > totalPages) {
    page = totalPages;
    ({ wallets, totalCount } = await getWalletsList(supabase, {
      ...listParams,
      page,
      pageSize: PAGE_SIZE,
    }));
  }

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Wallets"
        searchPlaceholder="Search wallets…"
        addButton={
          <WalletModal
            trigger="Add wallet"
            title="Add wallet"
            submitLabel="Add"
            action={addWallet}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
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
