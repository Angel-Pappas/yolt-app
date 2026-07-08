import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * VAT owed is never stored — it's a live aggregate over transactions, so
 * it can never drift out of sync as transactions are added, edited,
 * deleted, or restored. When other tax types are added later, each gets
 * its own aggregate computed the same way.
 */
export async function getTotalVat(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("transactions")
    .select("vat_amount")
    .eq("is_deleted", false)
    .returns<{ vat_amount: string }[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.vat_amount), 0);
}
