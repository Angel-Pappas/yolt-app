"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Shared URL-search-params helper for everything on the Transactions page
 * that reads/writes filter, sort, or page state (the filters bar, the
 * sortable/filterable table header, and pagination) — one place for the
 * "merge into the current query string and navigate" logic so all three
 * stay consistent about resetting `page` when a filter or sort changes.
 */
export function useTransactionParams() {
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
