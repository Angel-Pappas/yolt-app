import { createClient } from "@/lib/supabase/server";
import { TablePagination } from "@/components/table/pagination";
import { ListPageHeader } from "@/components/table/list-page-header";
import { addCategory } from "./actions";
import {
  CATEGORY_SORT_KEYS,
  getCategoriesList,
  type CategorySortDir,
  type CategorySortKey,
  type CategoryType,
} from "./queries";
import { CategoryModal } from "./category-modal";
import { CategoryRow } from "./category-row";
import { CategoryTableHeader } from "./category-table-header";

const PAGE_SIZE = 25;
const CATEGORY_TYPES: CategoryType[] = ["income", "expense"];

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function parseSort(searchParams: RawSearchParams): { sort: CategorySortKey; dir: CategorySortDir } {
  const sortParam = getParam(searchParams, "sort");
  const sort = CATEGORY_SORT_KEYS.includes(sortParam as CategorySortKey)
    ? (sortParam as CategorySortKey)
    : "name";
  const dir: CategorySortDir = getParam(searchParams, "dir") === "desc" ? "desc" : "asc";
  return { sort, dir };
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const supabase = await createClient();
  const rawParams = await searchParams;
  const search = getParam(rawParams, "q")?.trim();
  const typeParam = getParam(rawParams, "type");
  const type =
    typeParam && CATEGORY_TYPES.includes(typeParam as CategoryType)
      ? (typeParam as CategoryType)
      : undefined;
  const { sort, dir } = parseSort(rawParams);

  const rawPage = Number(getParam(rawParams, "page"));
  const requestedPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let { categories, totalCount } = await getCategoriesList(supabase, {
    search,
    type,
    sort,
    dir,
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let page = requestedPage;

  if (requestedPage > totalPages) {
    page = totalPages;
    ({ categories, totalCount } = await getCategoriesList(supabase, {
      search,
      type,
      sort,
      dir,
      page,
      pageSize: PAGE_SIZE,
    }));
  }

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <ListPageHeader
        title="Categories"
        searchPlaceholder="Search categories…"
        addButton={
          <CategoryModal
            trigger="Add category"
            title="Add category"
            submitLabel="Add"
            action={addCategory}
          />
        }
      />

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <CategoryTableHeader />
            <tbody>
              {categories.map((c) => (
                <CategoryRow key={c.id} category={c} />
              ))}
              {totalCount === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-ink-faint">
                    {search ? "No categories match this search." : "No categories yet."}
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
