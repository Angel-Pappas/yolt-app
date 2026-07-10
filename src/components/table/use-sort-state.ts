"use client";

import { useListParams } from "./use-list-params";

export type SortDir = "asc" | "desc";

/**
 * Shared tri-state sort behavior for every table's header: each column
 * cycles unsorted -> descending -> ascending -> unsorted (1 click = desc,
 * 2nd = asc, 3rd clears back to unsorted, at which point the page's own
 * default/natural ordering applies). Deliberately does NOT default
 * `currentSort`/`currentDir` to any column when the URL has no `sort`
 * param — "no param" must mean every header shows as genuinely unsorted,
 * even though the underlying query still has to pick *some* order (each
 * query function already falls back to its own default sort key when
 * `sort` is undefined — see e.g. getActiveTransactions).
 */
export function useSortState<TSortKey extends string>(validKeys: readonly TSortKey[]) {
  const { searchParams, setFilterParams } = useListParams();

  const sortParam = searchParams.get("sort");
  const currentSort: TSortKey | null = validKeys.includes(sortParam as TSortKey)
    ? (sortParam as TSortKey)
    : null;

  const dirParam = searchParams.get("dir");
  const currentDir: SortDir | null =
    currentSort && (dirParam === "asc" || dirParam === "desc") ? dirParam : null;

  function handleSort(key: TSortKey) {
    if (currentSort !== key) {
      setFilterParams({ sort: key, dir: "desc" });
    } else if (currentDir === "desc") {
      setFilterParams({ sort: key, dir: "asc" });
    } else {
      setFilterParams({ sort: null, dir: null });
    }
  }

  return { currentSort, currentDir, handleSort };
}
