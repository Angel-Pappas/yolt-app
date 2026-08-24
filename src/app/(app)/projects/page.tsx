import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseListParam } from "@/lib/parse-params";
import { requireCrm } from "../require-access";
import { PROJECT_SORT_KEYS, getProjectsList } from "./queries";
import { getActiveProjectStatuses } from "../settings/project-statuses/queries";
import { ProjectAddModal } from "./project-add-modal";
import { ProjectRow } from "./project-row";
import { ProjectTableHeader } from "./project-table-header";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireCrm();
  const supabase = await createClient();
  const rawParams = await searchParams;
  const search = getParam(rawParams, "q")?.trim();
  const statusIds = parseListParam(getParam(rawParams, "status"));
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    PROJECT_SORT_KEYS
  );

  const [{ projects, totalCount }, { data: statuses }] = await Promise.all([
    getProjectsList(supabase, { search, statusIds, sort, dir }),
    getActiveProjectStatuses(supabase),
  ]);

  const statusOptions = (statuses ?? []).map((s) => ({ value: s.id, label: s.name }));
  // The header filter also offers "No status" (projects with no status set).
  const statusFilterOptions = [
    { value: "none", label: "No status" },
    ...statusOptions,
  ];

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Projects"
        addButton={<ProjectAddModal statuses={statuses ?? []} />}
        searchPlaceholder="Search projects…"
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <ProjectTableHeader statusOptions={statusFilterOptions} />
            <tbody>
              {projects.map((project, index) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  index={index}
                  statusOptions={statusOptions}
                />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-ink-faint"
                  >
                    {search || statusIds.length
                      ? "No projects match these filters."
                      : "No projects yet. Convert a lead to create one."}
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
