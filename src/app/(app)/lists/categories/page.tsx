import { createClient } from "@/lib/supabase/server";
import { ListPageHeader } from "@/components/table/list-page-header";
import { parseSortParam } from "@/components/table/parse-sort-param";
import { addCategory } from "./actions";
import { CATEGORY_SORT_KEYS, getCategoriesList, type CategoryType } from "./queries";
import { CategoryModal } from "./category-modal";
import { CategoryRow } from "./category-row";
import { CategoryTableHeader } from "./category-table-header";

const CATEGORY_TYPES: CategoryType[] = ["income", "expense"];

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
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
  const { sort, dir } = parseSortParam(
    getParam(rawParams, "sort"),
    getParam(rawParams, "dir"),
    CATEGORY_SORT_KEYS
  );

  // No paging anywhere in the app (2026-07) — the full matching list
  // renders and scrolls.
  const { categories, totalCount } = await getCategoriesList(supabase, {
    search,
    type,
    sort,
    dir,
  });

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
    </div>
  );
}
