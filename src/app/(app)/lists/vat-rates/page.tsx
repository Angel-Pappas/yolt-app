import { createClient } from "@/lib/supabase/server";
import { TablePagination } from "@/components/table/pagination";
import { ListPageHeader } from "@/components/table/list-page-header";
import { addVatRate } from "./vat-rate-actions";
import {
  VAT_RATE_SORT_KEYS,
  getVatRatesList,
  type VatRateSortDir,
  type VatRateSortKey,
} from "./vat-rate-queries";
import { VatRateModal } from "./vat-rate-modal";
import { VatRateRow } from "./vat-rate-row";
import { VatRateTableHeader } from "./vat-rate-table-header";

const PAGE_SIZE = 25;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function parseSort(searchParams: RawSearchParams): { sort: VatRateSortKey; dir: VatRateSortDir } {
  const sortParam = getParam(searchParams, "sort");
  const sort = VAT_RATE_SORT_KEYS.includes(sortParam as VatRateSortKey)
    ? (sortParam as VatRateSortKey)
    : "rate";
  const dir: VatRateSortDir = getParam(searchParams, "dir") === "desc" ? "desc" : "asc";
  return { sort, dir };
}

export default async function VatRatesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const { sort, dir } = parseSort(rawParams);

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let { vatRates, totalCount } = await getVatRatesList(supabase, {
    sort,
    dir,
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  if (requestedPage > totalPages) {
    page = totalPages;
    ({ vatRates, totalCount } = await getVatRatesList(supabase, {
      sort,
      dir,
      page,
      pageSize: PAGE_SIZE,
    }));
  }

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="VAT rates"
        addButton={
          <VatRateModal
            trigger="Add VAT rate"
            title="Add VAT rate"
            submitLabel="Add"
            action={addVatRate}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <VatRateTableHeader />
            <tbody>
              {vatRates.map((v) => (
                <VatRateRow key={v.id} vatRate={v} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-faint">
                    No VAT rates yet.
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
