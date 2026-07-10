import type { SupabaseClient } from "@supabase/supabase-js";

export type VatRate = {
  id: string;
  name: string;
  rate: string;
};

/**
 * The single place that knows how to fetch a user's non-deleted VAT rates.
 * Unpaginated — used wherever the *full* list is needed (the Transactions
 * page's VAT filter dropdown, etc). For the Options page's own
 * sortable/paginated VAT rates list, see `getVatRatesList` below.
 */
export async function getActiveVatRates(supabase: SupabaseClient) {
  return supabase
    .from("vat_rates")
    .select("id, name, rate")
    .eq("is_deleted", false)
    .order("rate", { ascending: true })
    .returns<VatRate[]>();
}

export type VatRateSortKey = "name" | "rate";
export type VatRateSortDir = "asc" | "desc";

export const VAT_RATE_SORT_KEYS: VatRateSortKey[] = ["name", "rate"];

export type VatRateListParams = {
  sort?: VatRateSortKey;
  dir?: VatRateSortDir;
  page?: number;
  pageSize?: number;
};

export type VatRateListResult = {
  vatRates: VatRate[];
  totalCount: number;
};

/**
 * The Options page's VAT rates list: sort + pagination (no search — this
 * is a short, rarely-changed list, see options/page.tsx), part of the
 * shared table template (src/components/table/). Kept separate from
 * getActiveVatRates above so a dropdown elsewhere in the app can never be
 * silently truncated to one page's worth of rows.
 */
export async function getVatRatesList(
  supabase: SupabaseClient,
  params: VatRateListParams = {}
): Promise<VatRateListResult> {
  const sort = params.sort ?? "rate";
  const dir = params.dir ?? "asc";
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  let query = supabase
    .from("vat_rates")
    .select("id, name, rate", { count: "exact" })
    .eq("is_deleted", false);

  query = query.order(sort, { ascending: dir === "asc" });
  if (sort !== "rate") {
    query = query.order("rate", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query.returns<VatRate[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    vatRates: data ?? [],
    totalCount: count ?? 0,
  };
}
