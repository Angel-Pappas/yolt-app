"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Shared URL-search-params helper for any list page's filter/sort/page
 * state (the search box, date range, sortable/filterable headers, and
 * pagination) — one place for the "merge into the current query string and
 * navigate" logic so all of them stay consistent about resetting `page`
 * when a filter or sort changes. Used by every table in the app (see
 * src/components/table/), not just Transactions, which is where this was
 * originally built.
 */
export function useListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(params: URLSearchParams) {
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  /** Sets/clears one or more filter or sort params, resetting pagination back to page 1. */
  function setFilterParams(entries: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    navigate(params);
  }

  /** Sets the current page without touching any filter/sort params. */
  function setPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    navigate(params);
  }

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  return { searchParams, setFilterParams, setPage, clearAll };
}
