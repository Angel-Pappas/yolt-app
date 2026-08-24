import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type LeadStatus = {
  id: string;
  name: string;
  position: number;
  /** The single flagged "Project agreed" status set by lead→project conversion. */
  is_conversion: boolean;
};

/**
 * The full active status list, ordered for display in the lead form's dropdown
 * (by position, then name). Kept separate from getLeadStatusesList so the
 * dropdown is never truncated by that one's search/sort.
 */
export async function getActiveLeadStatuses(supabase: TypedSupabaseClient) {
  return supabase
    .from("lead_statuses")
    .select("id, name, position, is_conversion")
    .eq("is_deleted", false)
    .order("position", { ascending: true })
    .order("name", { ascending: true })
    .returns<LeadStatus[]>();
}

export type LeadStatusSortKey = "name";
export type LeadStatusSortDir = "asc" | "desc";

export const LEAD_STATUS_SORT_KEYS: LeadStatusSortKey[] = ["name"];

export type LeadStatusListParams = {
  search?: string;
  sort?: LeadStatusSortKey;
  dir?: LeadStatusSortDir;
};

export type LeadStatusListResult = {
  statuses: LeadStatus[];
  totalCount: number;
};

/** Escapes ILIKE wildcards so a literal "%"/"_" isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

/** The Lead statuses settings page's own list view (search + sort, DB-level). */
export async function getLeadStatusesList(
  supabase: TypedSupabaseClient,
  params: LeadStatusListParams = {}
): Promise<LeadStatusListResult> {
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";

  let query = supabase
    .from("lead_statuses")
    .select("id, name, position, is_conversion", { count: "exact" })
    .eq("is_deleted", false);

  if (params.search) {
    query = query.ilike("name", `%${escapeLikePattern(params.search)}%`);
  }

  query = query.order(sort, { ascending: dir === "asc" });

  const { data, error, count } = await query.returns<LeadStatus[]>();
  if (error) {
    throw new Error(error.message);
  }

  return { statuses: data ?? [], totalCount: count ?? 0 };
}
