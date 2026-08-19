import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
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
  const originId = getParam(rawParams, "origin");
  const statusId = getParam(rawParams, "status");
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    LEAD_SORT_KEYS
  );

  const [{ leads, totalCount }, { data: origins }, { data: statuses }, users] =
    await Promise.all([
      getLeadsList(supabase, { search, originId, statusId, sort, dir }),
      getActiveLeadOrigins(supabase),
      getActiveLeadStatuses(supabase),
      profile.isAdmin
        ? getUsersForPicker(supabase)
        : Promise.resolve([
            { id: profile.id, name: profile.name || profile.email || "Me" },
          ]),
    ]);

  const originOptions = (origins ?? []).map((o) => ({ value: o.id, label: o.name }));
  const statusOptions = (statuses ?? []).map((s) => ({ value: s.id, label: s.name }));

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
              statusOptions={statusOptions}
            />
            <tbody>
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
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
                    {search || originId || statusId
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
