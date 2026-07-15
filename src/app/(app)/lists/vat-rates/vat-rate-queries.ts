import type { TypedSupabaseClient } from "@/lib/supabase/types";

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
export async function getActiveVatRates(supabase: TypedSupabaseClient) {
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
  /** Matched against name — no toolbar search box on this page (short, rarely-changed list), only reachable via the Name column's header filter. */
  search?: string;
  sort?: VatRateSortKey;
  dir?: VatRateSortDir;
  rateMin?: number;
  rateMax?: number;
  page?: number;
  pageSize?: number;
};

/** Escapes ILIKE's wildcard characters so a literal "%" or "_" in a search term isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

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
  supabase: TypedSupabaseClient,
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

  if (params.search) {
    query = query.ilike("name", `%${escapeLikePattern(params.search)}%`);
  }
  if (params.rateMin !== undefined) {
    query = query.gte("rate", params.rateMin);
  }
  if (params.rateMax !== undefined) {
    query = query.lte("rate", params.rateMax);
  }

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
