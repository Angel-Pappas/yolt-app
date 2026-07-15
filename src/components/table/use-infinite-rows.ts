"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The load-as-you-scroll state machine for a long list: holds the rows
 * accumulated so far, fetches the next span when a sentinel scrolls into
 * view, and keeps the accumulated list honest when the server data changes
 * underneath it.
 *
 * Shared mechanics only — the *rendering* stays with the caller, same seam
 * as ModalShell/useDialog (mechanics shared, fields per-modal). A generic
 * component can't own the rows here anyway: `renderRow` would have to cross
 * the server/client boundary, and functions aren't serializable.
 *
 * Two things worth knowing:
 *
 * **Resetting on a filter change is the caller's job**, via `key`. When
 * the URL's filters change, the server re-renders with a fresh first span;
 * keying this component on the filter signature remounts it, so the state
 * here starts clean. That's why there's no "filters changed" input — the
 * hook never sees one.
 *
 * **A mutation elsewhere on the page must not desync the tail.** After an
 * add/edit/delete, `revalidatePath` re-renders the page and hands down a
 * fresh `initialRows`, but everything past the first span is client state
 * the server knows nothing about — a delete would shift every later row up
 * by one and silently duplicate a row at the seam. So when `initialRows`
 * changes identity (i.e. the server sent new data), the whole loaded span
 * is re-fetched in a single request and swapped in. That costs one query,
 * keeps the user exactly where they were scrolled to, and is the reason
 * `loadRange` takes an arbitrary offset/limit rather than a page number.
 */
export function useInfiniteRows<T>({
  initialRows,
  totalCount,
  pageSize,
  loadRange,
}: {
  /** The first span, rendered on the server. Treated as the source of truth whenever its identity changes. */
  initialRows: T[];
  /** Total matching the current filters, from the same server query — what tells us whether there's more to fetch. */
  totalCount: number;
  pageSize: number;
  /** Fetches `limit` rows starting at `offset`, under the same filters the server used. */
  loadRange: (offset: number, limit: number) => Promise<T[]>;
}) {
  const [rows, setRows] = useState<T[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = rows.length < totalCount;

  // Mirrors of the latest render's values, for the IntersectionObserver
  // callback and the re-sync below — both run outside render and would
  // otherwise close over a stale `rows`/`hasMore`/`loadRange`. Written in
  // an effect rather than during render (refs must not be mutated while
  // rendering), and declared before every other effect here so those see
  // fresh values: effects run in declaration order.
  const rowsRef = useRef(rows);
  const hasMoreRef = useRef(hasMore);
  const loadRangeRef = useRef(loadRange);
  const loadingRef = useRef(false);

  useEffect(() => {
    rowsRef.current = rows;
    hasMoreRef.current = hasMore;
    loadRangeRef.current = loadRange;
  });

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const next = await loadRangeRef.current(rowsRef.current.length, pageSize);
      // Append rather than replace; concurrent calls are already prevented
      // by the loading guard above.
      setRows((current) => [...current, ...next]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more rows");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [pageSize]);

  // Re-sync after a mutation revalidates the page. Skipped on mount, where
  // `rows` already *is* `initialRows` and a fetch would be pure waste.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const loadedCount = rowsRef.current.length;
    // Only the first span is loaded: the server already handed us the
    // truth, so take it directly instead of asking again.
    if (loadedCount <= initialRows.length) {
      setRows(initialRows);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fresh = await loadRangeRef.current(0, loadedCount);
        if (!cancelled) setRows(fresh);
      } catch {
        // A failed re-sync leaves the previous rows on screen rather than
        // blanking the list; the next scroll or navigation will retry.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialRows]);

  // The sentinel is a callback ref so the observer re-attaches if the
  // element remounts (e.g. it's hidden once the list is fully loaded).
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) void loadMore();
        },
        // Start fetching before the sentinel is actually on screen, so the
        // next rows are usually already there by the time you reach them.
        { rootMargin: "600px 0px" }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [loadMore]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { rows, hasMore, loading, error, sentinelRef, retry: loadMore };
}
