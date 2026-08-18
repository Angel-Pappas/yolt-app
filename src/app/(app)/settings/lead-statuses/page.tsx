import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { requireCrm } from "../../require-access";
import { addLeadStatus } from "./actions";
import { LEAD_STATUS_SORT_KEYS, getLeadStatusesList } from "./queries";
import { LeadStatusModal } from "./lead-status-modal";
import { LeadStatusRow } from "./lead-status-row";
import { LeadStatusTableHeader } from "./lead-status-table-header";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function LeadStatusesPage({
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
    LEAD_STATUS_SORT_KEYS
  );

  const { statuses, totalCount } = await getLeadStatusesList(supabase, {
    search,
    sort,
    dir,
  });

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Lead statuses"
        searchPlaceholder="Search statuses…"
        addButton={
          <LeadStatusModal
            trigger="Add status"
            title="Add status"
            submitLabel="Add"
            action={addLeadStatus}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <LeadStatusTableHeader />
            <tbody>
              {statuses.map((s) => (
                <LeadStatusRow key={s.id} status={s} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-sm text-ink-faint"
                  >
                    {search
                      ? "No statuses match this search."
                      : "No statuses yet."}
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
