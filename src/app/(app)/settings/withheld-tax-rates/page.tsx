import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseNumberParam } from "@/lib/parse-params";
import { requireFinance } from "../../require-access";
import { addWithheldTaxRate } from "./withheld-tax-rate-actions";
import {
  WITHHELD_TAX_RATE_SORT_KEYS,
  getWithheldTaxRatesList,
} from "./withheld-tax-rate-queries";
import { WithheldTaxRateModal } from "./withheld-tax-rate-modal";
import { WithheldTaxRateRow } from "./withheld-tax-rate-row";
import { WithheldTaxRateTableHeader } from "./withheld-tax-rate-table-header";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function WithheldTaxRatesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireFinance();
  const supabase = await createClient();
  const rawParams = await searchParams;
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    WITHHELD_TAX_RATE_SORT_KEYS
  );
  const search = getParam(rawParams, "q")?.trim();
  const rateMin = parseNumberParam(getParam(rawParams, "rate_min"));
  const rateMax = parseNumberParam(getParam(rawParams, "rate_max"));

  const { withheldTaxRates, totalCount } = await getWithheldTaxRatesList(supabase, {
    search,
    sort,
    dir,
    rateMin,
    rateMax,
  });

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Withheld tax"
        addButton={
          <WithheldTaxRateModal
            trigger="Add withheld tax rate"
            title="Add withheld tax rate"
            submitLabel="Add"
            action={addWithheldTaxRate}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <WithheldTaxRateTableHeader />
            <tbody>
              {withheldTaxRates.map((r) => (
                <WithheldTaxRateRow key={r.id} withheldTaxRate={r} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {search || rateMin !== undefined || rateMax !== undefined
                      ? "No withheld tax rates match these filters."
                      : "No withheld tax rates yet."}
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
