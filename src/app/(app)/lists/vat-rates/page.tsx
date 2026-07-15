import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseNumberParam } from "@/lib/parse-params";
import { addVatRate } from "./vat-rate-actions";
import { VAT_RATE_SORT_KEYS, getVatRatesList } from "./vat-rate-queries";
import { VatRateModal } from "./vat-rate-modal";
import { VatRateRow } from "./vat-rate-row";
import { VatRateTableHeader } from "./vat-rate-table-header";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function VatRatesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    VAT_RATE_SORT_KEYS
  );
  const search = getParam(rawParams, "q")?.trim();
  const rateMin = parseNumberParam(getParam(rawParams, "rate_min"));
  const rateMax = parseNumberParam(getParam(rawParams, "rate_max"));

  // No paging anywhere in the app (2026-07) — the full matching list
  // renders and scrolls.
  const { vatRates, totalCount } = await getVatRatesList(supabase, {
    search,
    sort,
    dir,
    rateMin,
    rateMax,
  });

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
                    {search || rateMin !== undefined || rateMax !== undefined
                      ? "No VAT rates match these filters."
                      : "No VAT rates yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
