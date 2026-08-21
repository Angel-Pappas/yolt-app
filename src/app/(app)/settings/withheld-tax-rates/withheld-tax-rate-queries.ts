import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type WithheldTaxRate = {
  id: string;
  name: string;
  rate: string;
};

/**
 * The single place that knows how to fetch a user's non-deleted withheld
 * tax rates. Unpaginated — used wherever the *full* list is needed (the
 * transaction form's withheld-line rate dropdown, etc). For the Settings
 * page's own sortable/filterable list, see `getWithheldTaxRatesList` below.
 * Mirrors getActiveVatRates — withholding tax rates behave exactly like VAT
 * rates as a lookup list, only the calculation they drive differs.
 */
export async function getActiveWithheldTaxRates(supabase: TypedSupabaseClient) {
  return supabase
    .from("withheld_tax_rates")
    .select("id, name, rate")
    .eq("is_deleted", false)
    .order("rate", { ascending: true })
    .returns<WithheldTaxRate[]>();
}

export type WithheldTaxRateSortKey = "name" | "rate";
export type WithheldTaxRateSortDir = "asc" | "desc";

export const WITHHELD_TAX_RATE_SORT_KEYS: WithheldTaxRateSortKey[] = ["name", "rate"];

export type WithheldTaxRateListParams = {
  /** Matched against name — no toolbar search box (short, rarely-changed list), only the Name column's header filter. */
  search?: string;
  sort?: WithheldTaxRateSortKey;
  dir?: WithheldTaxRateSortDir;
  rateMin?: number;
  rateMax?: number;
};

/** Escapes ILIKE's wildcard characters so a literal "%" or "_" in a search term isn't treated as a pattern. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

export type WithheldTaxRateListResult = {
  withheldTaxRates: WithheldTaxRate[];
  totalCount: number;
};

/**
 * The Settings page's withheld tax rates list: sort + filter (no search box
 * — short, rarely-changed list, same reasoning as VAT rates), part of the
 * shared table template. Kept separate from getActiveWithheldTaxRates above
 * so a dropdown elsewhere can never be silently truncated to a page's rows.
 */
export async function getWithheldTaxRatesList(
  supabase: TypedSupabaseClient,
  params: WithheldTaxRateListParams = {}
): Promise<WithheldTaxRateListResult> {
  const sort = params.sort ?? "rate";
  const dir = params.dir ?? "asc";

  let query = supabase
    .from("withheld_tax_rates")
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

  const { data, error, count } = await query.returns<WithheldTaxRate[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    withheldTaxRates: data ?? [],
    totalCount: count ?? 0,
  };
}
