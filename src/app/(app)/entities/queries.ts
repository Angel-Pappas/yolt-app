import type { SupabaseClient } from "@supabase/supabase-js";

export type Entity = {
  id: string;
  name: string;
  vat_number: string | null;
};

/**
 * The single place that knows how to fetch a user's non-deleted entities.
 * Unpaginated — used wherever the *full* list is needed (the Transactions
 * page's Entity combobox and filter dropdown, etc). For the Entities
 * page's own searchable/sortable/paginated list view, see
 * `getEntitiesList` below.
 */
export async function getActiveEntities(supabase: SupabaseClient) {
  return supabase
    .from("entities")
    .select("id, name, vat_number")
    .eq("is_deleted", false)
    .order("name", { ascending: true })
    .returns<Entity[]>();
}

export type EntitySortKey = "name" | "vat_number";
export type EntitySortDir = "asc" | "desc";

export const ENTITY_SORT_KEYS: EntitySortKey[] = ["name", "vat_number"];

export type EntityListParams = {
  /** Matched against name OR VAT number. */
  search?: string;
  sort?: EntitySortKey;
  dir?: EntitySortDir;
  page?: number;
  pageSize?: number;
};

export type EntityListResult = {
  entities: Entity[];
  totalCount: number;
};

/** Escapes ILIKE's wildcard characters so a literal "%" or "_" in a search term isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

/**
 * The Entities page's own list view: search + sort + pagination, all at
 * the database level, same shape as transactions/queries.ts's
 * getActiveTransactions (part of the shared table template — see
 * src/components/table/). Kept separate from getActiveEntities above so
 * a dropdown elsewhere in the app can never be silently truncated to one
 * page's worth of rows.
 */
export async function getEntitiesList(
  supabase: SupabaseClient,
  params: EntityListParams = {}
): Promise<EntityListResult> {
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  let query = supabase
    .from("entities")
    .select("id, name, vat_number", { count: "exact" })
    .eq("is_deleted", false);

  if (params.search) {
    const pattern = `%${escapeLikePattern(params.search)}%`;
    query = query.or(`name.ilike.${pattern},vat_number.ilike.${pattern}`);
  }

  query = query.order(sort, { ascending: dir === "asc" });
  if (sort !== "name") {
    query = query.order("name", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query.returns<Entity[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    entities: data ?? [],
    totalCount: count ?? 0,
  };
}
