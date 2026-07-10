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
