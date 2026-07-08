import type { SupabaseClient } from "@supabase/supabase-js";

export type Entity = {
  id: string;
  name: string;
  vat_number: string | null;
};

/**
 * The single place that knows how to fetch a user's non-deleted entities.
 * See transactions/queries.ts for why filtering is done here and not in
 * the SELECT RLS policy.
 */
export async function getActiveEntities(supabase: SupabaseClient) {
  return supabase
    .from("entities")
    .select("id, name, vat_number")
    .eq("is_deleted", false)
    .order("name", { ascending: true })
    .returns<Entity[]>();
}
