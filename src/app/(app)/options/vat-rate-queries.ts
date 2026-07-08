import type { SupabaseClient } from "@supabase/supabase-js";

export type VatRate = {
  id: string;
  name: string;
  rate: string;
};

/**
 * The single place that knows how to fetch a user's non-deleted VAT rates.
 * See transactions/queries.ts for why filtering is done here and not in
 * the SELECT RLS policy.
 */
export async function getActiveVatRates(supabase: SupabaseClient) {
  return supabase
    .from("vat_rates")
    .select("id, name, rate")
    .eq("is_deleted", false)
    .order("rate", { ascending: true })
    .returns<VatRate[]>();
}
