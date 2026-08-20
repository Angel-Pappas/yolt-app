/**
 * Validates a raw numeric URL search param before it reaches a Supabase
 * query — same spirit as the UUID/date/enum validation each page's
 * parseFilters already does (see e.g. transactions/page.tsx): an invalid
 * value is silently dropped (treated as "no filter") rather than passed
 * straight to `.gte()`/`.lte()`.
 */
export function parseNumberParam(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Splits a comma-separated multi-select filter param (e.g. `status=a,b,c`)
 * into a deduplicated list of trimmed, non-empty values. Returns [] for an
 * absent/blank param. The caller is responsible for validating each element
 * (UUID / enum) before it reaches a query, same as the single-value params.
 */
export function parseListParam(value: string | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen];
}
