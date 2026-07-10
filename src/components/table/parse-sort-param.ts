/**
 * Server-side counterpart to use-sort-state.ts: validates the raw `sort`/
 * `dir` URL params against a page's own SortKey union, returning
 * `undefined` for both when absent/invalid rather than defaulting to a
 * column — "unsorted" must reach the query layer as "no sort requested"
 * so each query function's own default ordering applies (and so the
 * header shows no column as active), not silently pinned to one key.
 */
export function parseSortParam<TSortKey extends string>(
  sortParam: string | undefined,
  dirParam: string | undefined,
  validKeys: readonly TSortKey[]
): { sort: TSortKey | undefined; dir: "asc" | "desc" | undefined } {
  const sort = validKeys.includes(sortParam as TSortKey) ? (sortParam as TSortKey) : undefined;
  const dir = sort && (dirParam === "asc" || dirParam === "desc") ? dirParam : undefined;
  return { sort, dir };
}
