import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { requireCrm } from "../../require-access";
import { addProjectStatus } from "./actions";
import { PROJECT_STATUS_SORT_KEYS, getProjectStatusesList } from "./queries";
import { ProjectStatusModal } from "./project-status-modal";
import { ProjectStatusRow } from "./project-status-row";
import { ProjectStatusTableHeader } from "./project-status-table-header";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function ProjectStatusesPage({
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
    PROJECT_STATUS_SORT_KEYS
  );

  const { statuses, totalCount } = await getProjectStatusesList(supabase, {
    search,
    sort,
    dir,
  });

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Project statuses"
        searchPlaceholder="Search statuses…"
        addButton={
          <ProjectStatusModal
            trigger="Add status"
            title="Add status"
            submitLabel="Add"
            action={addProjectStatus}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <ProjectStatusTableHeader />
            <tbody>
              {statuses.map((s) => (
                <ProjectStatusRow key={s.id} status={s} />
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
