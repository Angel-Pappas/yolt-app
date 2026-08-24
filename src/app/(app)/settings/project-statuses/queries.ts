import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type ProjectStatus = {
  id: string;
  name: string;
  position: number;
};

/**
 * The full active status list, ordered for display in the project form's
 * dropdown (by position, then name). Kept separate from getProjectStatusesList
 * so the dropdown is never truncated by that one's search/sort.
 */
export async function getActiveProjectStatuses(supabase: TypedSupabaseClient) {
  return supabase
    .from("project_statuses")
    .select("id, name, position")
    .eq("is_deleted", false)
    .order("position", { ascending: true })
    .order("name", { ascending: true })
    .returns<ProjectStatus[]>();
}

export type ProjectStatusSortKey = "name";
export type ProjectStatusSortDir = "asc" | "desc";

export const PROJECT_STATUS_SORT_KEYS: ProjectStatusSortKey[] = ["name"];

export type ProjectStatusListParams = {
  search?: string;
  sort?: ProjectStatusSortKey;
  dir?: ProjectStatusSortDir;
};

export type ProjectStatusListResult = {
  statuses: ProjectStatus[];
  totalCount: number;
};

/** Escapes ILIKE wildcards so a literal "%"/"_" isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

/** The Project statuses settings page's own list view (search + sort, DB-level). */
export async function getProjectStatusesList(
  supabase: TypedSupabaseClient,
  params: ProjectStatusListParams = {}
): Promise<ProjectStatusListResult> {
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";

  let query = supabase
    .from("project_statuses")
    .select("id, name, position", { count: "exact" })
    .eq("is_deleted", false);

  if (params.search) {
    query = query.ilike("name", `%${escapeLikePattern(params.search)}%`);
  }

  query = query.order(sort, { ascending: dir === "asc" });

  const { data, error, count } = await query.returns<ProjectStatus[]>();
  if (error) {
    throw new Error(error.message);
  }

  return { statuses: data ?? [], totalCount: count ?? 0 };
}
