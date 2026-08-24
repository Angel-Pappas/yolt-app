import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { parseListParam } from "@/lib/parse-params";
import { requireCrm } from "../require-access";
import { LEAD_SORT_KEYS, getLeadsList, getUsersForPicker } from "./queries";
import { getActiveLeadOrigins } from "../settings/lead-origins/queries";
import { getActiveLeadStatuses } from "../settings/lead-statuses/queries";
import { LeadAddModal } from "./lead-add-modal";
import { LeadRow } from "./lead-row";
import { LeadTableHeader } from "./lead-table-header";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const profile = await requireCrm();
  const supabase = await createClient();
  const rawParams = await searchParams;
  const search = getParam(rawParams, "q")?.trim();
  const originIds = parseListParam(getParam(rawParams, "origin"));
  const statusIds = parseListParam(getParam(rawParams, "status"));
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    LEAD_SORT_KEYS
  );

  const { data: allStatuses } = await getActiveLeadStatuses(supabase);
  // The "Project agreed" conversion status: hidden from the default list and
  // from manual editors, but still tickable in the status filter to reveal
  // converted leads.
  const conversionStatusId =
    (allStatuses ?? []).find((s) => s.is_conversion)?.id ?? null;

  const [{ leads, totalCount }, { data: origins }, users] = await Promise.all([
    getLeadsList(supabase, {
      search,
      originIds,
      statusIds,
      conversionStatusId,
      sort,
      dir,
    }),
    getActiveLeadOrigins(supabase),
    profile.isAdmin
      ? getUsersForPicker(supabase)
      : Promise.resolve([
          { id: profile.id, name: profile.name || profile.email || "Me" },
        ]),
  ]);
  const statuses = allStatuses;

  const originOptions = (origins ?? []).map((o) => ({ value: o.id, label: o.name }));
  // Inline status editor on each row — offers the normal statuses only, never
  // "Project agreed" (that's set by conversion, not picked by hand).
  const statusOptions = (statuses ?? [])
    .filter((s) => !s.is_conversion)
    .map((s) => ({ value: s.id, label: s.name }));
  // The header filter offers "No status" plus every status *including* the
  // conversion one, so a user can tick it to see converted leads.
  const statusFilterOptions = [
    { value: "none", label: "No status" },
    ...(statuses ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Leads"
        addButton={
          <LeadAddModal origins={origins ?? []} statuses={statuses ?? []} />
        }
        searchPlaceholder="Search leads…"
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <LeadTableHeader
              originOptions={originOptions}
              statusOptions={statusFilterOptions}
            />
            <tbody>
              {leads.map((lead, index) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  index={index}
                  users={users}
                  isAdmin={profile.isAdmin}
                  currentUserId={profile.id}
                  statusOptions={statusOptions}
                />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-ink-faint"
                  >
                    {search || originIds.length || statusIds.length
                      ? "No leads match these filters."
                      : "No leads yet."}
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
