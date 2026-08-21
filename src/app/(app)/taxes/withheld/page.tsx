import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireFinance } from "../../require-access";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseNumberParam } from "@/lib/parse-params";
import {
  getMonthlyWithheldList,
  MONTHLY_WITHHELD_SORT_KEYS,
  type MonthlyWithheldFilters,
} from "../queries";
import { WithheldTableHeader } from "./withheld-table-header";
import { WithheldRow } from "./withheld-row";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function parseFilters(searchParams: RawSearchParams): MonthlyWithheldFilters {
  const from = getParam(searchParams, "from");
  const to = getParam(searchParams, "to");

  return {
    periodFrom: from && DATE_RE.test(from) ? from : undefined,
    periodTo: to && DATE_RE.test(to) ? to : undefined,
    withheldMin: parseNumberParam(getParam(searchParams, "withheld_min")),
    withheldMax: parseNumberParam(getParam(searchParams, "withheld_max")),
    payableThisMin: parseNumberParam(getParam(searchParams, "payable_this_min")),
    payableThisMax: parseNumberParam(getParam(searchParams, "payable_this_max")),
  };
}

/**
 * The withholding-tax detail page — built on the shared table template like
 * every other list, same shape as /taxes/vat (no search box/Add button —
 * every row is a computed month; no max-w cap). Defaults to oldest-first.
 * "Payable this month" is the previous month's withholding, remitted to the
 * state by the end of this month; "Withheld this month" is what's collected
 * now and thus payable next month.
 */
export default async function WithheldTaxPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireFinance();
  const supabase = await createClient();
  const rawParams = await searchParams;

  const filters = parseFilters(rawParams);
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    MONTHLY_WITHHELD_SORT_KEYS
  );
  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined);

  const { months, totalCount } = await getMonthlyWithheldList(supabase, { filters, sort, dir });

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div className="space-y-3">
        <Link
          href="/taxes"
          className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
        >
          ← Taxes
        </Link>
        <ListPageHeader title="Withheld tax" />
      </div>

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <WithheldTableHeader />
            <tbody>
              {months.map((m) => (
                <WithheldRow key={m.period} month={m} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {hasActiveFilters
                      ? "No months match these filters."
                      : "No withholding recorded yet."}
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
