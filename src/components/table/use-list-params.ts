"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Shared URL-search-params helper for any list page's filter/sort state
 * (the search box, date range, sortable/filterable headers) — one place
 * for the "merge into the current query string and navigate" logic, so
 * every filter on every page agrees about how it composes with the others.
 * Used by every table in the app (see src/components/table/), not just
 * Transactions, where it started.
 *
 * Filters always merge rather than replace: setting one leaves the rest of
 * the querystring intact, which is what makes the header filters, the
 * toolbar search, the date range, and the quick-filter toggles stack
 * instead of clobbering each other.
 *
 * There's no page state to manage: no table in the app paginates any more
 * (2026-07) — small lists render in full, and Transactions loads more as
 * you scroll (see use-infinite-rows.ts), keyed on this querystring so any
 * filter change starts it over.
 */
export function useListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(params: URLSearchParams) {
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  /** Sets/clears one or more filter or sort params, leaving every other param untouched. */
  function setFilterParams(entries: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // Drops a `page` left over from a bookmark made before pagination was
    // removed, so an old link doesn't carry a param nothing reads any more.
    params.delete("page");
    navigate(params);
  }

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  return { searchParams, setFilterParams, clearAll };
}
