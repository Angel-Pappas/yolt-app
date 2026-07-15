import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseNumberParam } from "@/lib/parse-params";
import {
  getMonthlyVatList,
  MONTHLY_VAT_SORT_KEYS,
  type MonthlyVatFilters,
} from "../queries";
import { VatTableHeader } from "./vat-table-header";
import { VatRow } from "./vat-row";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function parseFilters(searchParams: RawSearchParams): MonthlyVatFilters {
  const from = getParam(searchParams, "from");
  const to = getParam(searchParams, "to");

  return {
    periodFrom: from && DATE_RE.test(from) ? from : undefined,
    periodTo: to && DATE_RE.test(to) ? to : undefined,
    incomeVatMin: parseNumberParam(getParam(searchParams, "income_vat_min")),
    incomeVatMax: parseNumberParam(getParam(searchParams, "income_vat_max")),
    expenseVatMin: parseNumberParam(getParam(searchParams, "expense_vat_min")),
    expenseVatMax: parseNumberParam(getParam(searchParams, "expense_vat_max")),
    netMin: parseNumberParam(getParam(searchParams, "net_min")),
    netMax: parseNumberParam(getParam(searchParams, "net_max")),
    rolloverMin: parseNumberParam(getParam(searchParams, "rollover_min")),
    rolloverMax: parseNumberParam(getParam(searchParams, "rollover_max")),
    payableThisMin: parseNumberParam(getParam(searchParams, "payable_this_min")),
    payableThisMax: parseNumberParam(getParam(searchParams, "payable_this_max")),
    payableNextMin: parseNumberParam(getParam(searchParams, "payable_next_min")),
    payableNextMax: parseNumberParam(getParam(searchParams, "payable_next_max")),
  };
}

/**
 * Built on the shared table template like every other list in the app
 * (2026-07, explicit user direction — this page previously hand-rolled a
 * plain table with no per-column filters, which broke the app's standing
 * "every table is built the same way" rule). Still deliberately no
 * search box/Add button (nothing free-text to search, nothing to create —
 * every row is a computed month, not a record) and no `max-w` cap (seven
 * columns need the room). Defaults to oldest-first, matching the rest of
 * the app's display convention, unlike an earlier newest-first version of
 * this page.
 */
export default async function VatTaxPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;

  const filters = parseFilters(rawParams);
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    MONTHLY_VAT_SORT_KEYS
  );
  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined);

  // No paging anywhere in the app (2026-07) — every matching month
  // renders and scrolls. One row per calendar month, so this list grows by
  // twelve a year.
  const { months, totalCount } = await getMonthlyVatList(supabase, { filters, sort, dir });

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div className="space-y-3">
        <Link
          href="/taxes"
          className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
        >
          ← Taxes
        </Link>
        <ListPageHeader title="VAT" />
      </div>

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <VatTableHeader />
            <tbody>
              {months.map((m) => (
                <VatRow key={m.period} month={m} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {hasActiveFilters
                      ? "No months match these filters."
                      : "No VAT-bearing transactions yet."}
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
