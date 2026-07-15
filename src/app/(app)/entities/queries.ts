import type { TypedSupabaseClient } from "@/lib/supabase/types";

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
export async function getActiveEntities(supabase: TypedSupabaseClient) {
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
 * The Entities page's own list view: search + sort at the database level,
 * part of the shared table template (see src/components/table/). Kept
 * separate from getActiveEntities above so a dropdown elsewhere in the app
 * can never be silently truncated by this one's filtering.
 *
 * Returns every match rather than a page of them: no table in the app
 * paginates any more (2026-07 — see Summary.md), and an entity list is
 * inherently small and slow-growing (one row per counterparty ever dealt
 * with — under a hundred here), so the whole thing renders and simply
 * scrolls. Transactions is the only list big enough to need loading in
 * spans as you scroll; if this one ever reaches that scale, it should
 * adopt the same useInfiniteRows treatment rather than bring paging back.
 */
export async function getEntitiesList(
  supabase: TypedSupabaseClient,
  params: EntityListParams = {}
): Promise<EntityListResult> {
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";

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

  const { data, error, count } = await query.returns<Entity[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    entities: data ?? [],
    totalCount: count ?? 0,
  };
}
