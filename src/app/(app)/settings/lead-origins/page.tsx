import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { requireCrm } from "../../require-access";
import { addLeadOrigin } from "./actions";
import { LEAD_ORIGIN_SORT_KEYS, getLeadOriginsList } from "./queries";
import { LeadOriginModal } from "./lead-origin-modal";
import { LeadOriginRow } from "./lead-origin-row";
import { LeadOriginTableHeader } from "./lead-origin-table-header";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function LeadOriginsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireCrm();
  const supabase = await createClient();
  const rawParams = await searchParams;
  const search = getParam(rawParams, "q")?.trim();
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    LEAD_ORIGIN_SORT_KEYS
  );

  const { origins, totalCount } = await getLeadOriginsList(supabase, {
    search,
    sort,
    dir,
  });

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Lead origins"
        searchPlaceholder="Search origins…"
        addButton={
          <LeadOriginModal
            trigger="Add origin"
            title="Add origin"
            submitLabel="Add"
            action={addLeadOrigin}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <LeadOriginTableHeader />
            <tbody>
              {origins.map((o) => (
                <LeadOriginRow key={o.id} origin={o} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-sm text-ink-faint"
                  >
                    {search ? "No origins match this search." : "No origins yet."}
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
