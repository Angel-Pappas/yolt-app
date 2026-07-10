import { createClient } from "@/lib/supabase/server";
import { TablePagination } from "@/components/table/pagination";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { addEntity } from "./actions";
import { ENTITY_SORT_KEYS, getEntitiesList } from "./queries";
import { EntityModal } from "./entity-modal";
import { EntityRow } from "./entity-row";
import { EntityTableHeader } from "./entity-table-header";
import { ListPageHeader } from "@/components/table/list-page-header";

const PAGE_SIZE = 25;

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

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let { entities, totalCount } = await getEntitiesList(supabase, {
    search,
    sort,
    dir,
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  // Same "filters shrank the result set out from under the requested
  // page" clamp as Transactions — see that page for why.
  if (requestedPage > totalPages) {
    page = totalPages;
    ({ entities, totalCount } = await getEntitiesList(supabase, {
      search,
      sort,
      dir,
      page,
      pageSize: PAGE_SIZE,
    }));
  }

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

      <TablePagination page={page} totalPages={totalPages} />
    </div>
  );
}
