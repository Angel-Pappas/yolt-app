import { createClient } from "@/lib/supabase/server";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { addEntity } from "./actions";
import { ENTITY_SORT_KEYS, getEntitiesList } from "./queries";
import { EntityModal } from "./entity-modal";
import { EntityRow } from "./entity-row";
import { EntityTableHeader } from "./entity-table-header";
import { ListPageHeader } from "@/components/table/list-page-header";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const search = getParam(rawParams, "q")?.trim();
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    ENTITY_SORT_KEYS
  );

  // No paging anywhere in the app (2026-07): the full matching list renders
  // and scrolls — see getEntitiesList for why that suits this list's size.
  const { entities, totalCount } = await getEntitiesList(supabase, { search, sort, dir });

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Entities"
        searchPlaceholder="Search name or VAT number…"
        addButton={
          <EntityModal
            trigger="Add entity"
            title="Add entity"
            submitLabel="Add"
            action={addEntity}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <EntityTableHeader />
            <tbody>
              {entities.map((e) => (
                <EntityRow key={e.id} entity={e} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {search ? "No entities match this search." : "No entities yet."}
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
