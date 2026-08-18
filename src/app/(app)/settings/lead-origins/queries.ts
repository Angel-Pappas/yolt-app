import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type LeadOrigin = {
  id: string;
  name: string;
  position: number;
};

/** Full active origin list (position, then name) — for the lead form's picker. */
export async function getActiveLeadOrigins(supabase: TypedSupabaseClient) {
  return supabase
    .from("lead_origins")
    .select("id, name, position")
    .eq("is_deleted", false)
    .order("position", { ascending: true })
    .order("name", { ascending: true })
    .returns<LeadOrigin[]>();
}

export type LeadOriginSortKey = "name";
export type LeadOriginSortDir = "asc" | "desc";

export const LEAD_ORIGIN_SORT_KEYS: LeadOriginSortKey[] = ["name"];

export type LeadOriginListParams = {
  search?: string;
  sort?: LeadOriginSortKey;
  dir?: LeadOriginSortDir;
};

export type LeadOriginListResult = {
  origins: LeadOrigin[];
  totalCount: number;
};

function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

export async function getLeadOriginsList(
  supabase: TypedSupabaseClient,
  params: LeadOriginListParams = {}
): Promise<LeadOriginListResult> {
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";

  let query = supabase
    .from("lead_origins")
    .select("id, name, position", { count: "exact" })
    .eq("is_deleted", false);

  if (params.search) {
    query = query.ilike("name", `%${escapeLikePattern(params.search)}%`);
  }

  query = query.order(sort, { ascending: dir === "asc" });

  const { data, error, count } = await query.returns<LeadOrigin[]>();
  if (error) {
    throw new Error(error.message);
  }

  return { origins: data ?? [], totalCount: count ?? 0 };
}
