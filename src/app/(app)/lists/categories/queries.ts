import type { SupabaseClient } from "@supabase/supabase-js";

export type CategoryType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
};

/**
 * The single place that knows how to fetch a user's non-deleted
 * categories. Unpaginated — used wherever the *full* list is needed (the
 * Transactions page's category combobox, filtered client-side by the
 * form's current income/expense type). For the Categories page's own
 * searchable/sortable/paginated list view, see `getCategoriesList` below.
 */
export async function getActiveCategories(supabase: SupabaseClient) {
  return supabase
    .from("categories")
    .select("id, name, type")
    .eq("is_deleted", false)
    .order("name", { ascending: true })
    .returns<Category[]>();
}

export type CategorySortKey = "name" | "type";
export type CategorySortDir = "asc" | "desc";

export const CATEGORY_SORT_KEYS: CategorySortKey[] = ["name", "type"];

export type CategoryListParams = {
  search?: string;
  type?: CategoryType;
  sort?: CategorySortKey;
  dir?: CategorySortDir;
  page?: number;
  pageSize?: number;
};

export type CategoryListResult = {
  categories: Category[];
  totalCount: number;
};

/** Escapes ILIKE's wildcard characters so a literal "%" or "_" in a search term isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

/**
 * The Categories page's own list view: search + type filter + sort +
 * pagination, all at the database level, same shape as every other list
 * page (part of the shared table template — see src/components/table/).
 * Kept separate from getActiveCategories above so a dropdown elsewhere in
 * the app can never be silently truncated to one page's worth of rows.
 */
export async function getCategoriesList(
  supabase: SupabaseClient,
  params: CategoryListParams = {}
): Promise<CategoryListResult> {
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  let query = supabase
    .from("categories")
    .select("id, name, type", { count: "exact" })
    .eq("is_deleted", false);

  if (params.search) {
    query = query.ilike("name", `%${escapeLikePattern(params.search)}%`);
  }
  if (params.type) {
    query = query.eq("type", params.type);
  }

  query = query.order(sort, { ascending: dir === "asc" });
  if (sort !== "name") {
    query = query.order("name", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query.returns<Category[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    categories: data ?? [],
    totalCount: count ?? 0,
  };
}
