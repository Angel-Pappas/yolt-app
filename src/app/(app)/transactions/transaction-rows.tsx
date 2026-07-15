"use client";

import { useCallback } from "react";
import { useInfiniteRows } from "@/components/table/use-infinite-rows";
import { TransactionRow } from "./transaction-row";
import { loadMoreTransactions } from "./actions";
import type { Transaction } from "./queries";
import type { Entity } from "../entities/queries";
import type { Category } from "../lists/categories/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../lists/vat-rates/vat-rate-queries";

/**
 * The Transactions table body: renders the rows and pulls in more as the
 * user scrolls, replacing the old Previous/Next pager.
 *
 * The parent keys this on the current filter/sort signature, so any change
 * to them remounts this component and the accumulated rows reset to the
 * fresh first span the server just rendered — see useInfiniteRows for why
 * that reset is deliberately the parent's job rather than an effect here.
 *
 * `searchParamsString` is threaded down from the server render (rather than
 * read from useSearchParams) so the span this component asks for is parsed
 * from exactly the same querystring the first span was — no window in which
 * the two could disagree.
 */
export function TransactionRows({
  initialTransactions,
  totalCount,
  pageSize,
  searchParamsString,
  entities,
  categories,
  wallets,
  vatRates,
  balanceMode,
  columnCount,
  emptyMessage,
}: {
  initialTransactions: Transaction[];
  totalCount: number;
  pageSize: number;
  searchParamsString: string;
  entities: Entity[];
  categories: Category[];
  wallets: Wallet[];
  vatRates: VatRate[];
  balanceMode: boolean;
  /** For the colSpan of the empty/loading rows — the column count varies with balance view. */
  columnCount: number;
  emptyMessage: string;
}) {
  const loadRange = useCallback(
    (offset: number, limit: number) =>
      loadMoreTransactions(searchParamsString, offset, limit),
    [searchParamsString]
  );

  const { rows, hasMore, loading, error, sentinelRef, retry } = useInfiniteRows({
    initialRows: initialTransactions,
    totalCount,
    pageSize,
    loadRange,
  });

  return (
    <tbody>
      {rows.map((t) => (
        <TransactionRow
          key={t.id}
          transaction={t}
          entities={entities}
          categories={categories}
          wallets={wallets}
          vatRates={vatRates}
          balanceMode={balanceMode}
        />
      ))}

      {rows.length === 0 && (
        <tr>
          <td colSpan={columnCount} className="px-4 py-10 text-center text-sm text-ink-faint">
            {emptyMessage}
          </td>
        </tr>
      )}

      {error && (
        <tr>
          <td colSpan={columnCount} className="px-4 py-4 text-center text-sm">
            <span className="text-expense">{error}</span>{" "}
            <button
              type="button"
              onClick={() => void retry()}
              className="underline decoration-edge-strong underline-offset-4 hover:text-ink"
            >
              Try again
            </button>
          </td>
        </tr>
      )}

      {/*
        The scroll sentinel. It's a real row rather than a bare div because
        only <tr>/<td> are valid children of <tbody> — anything else gets
        hoisted out of the table by the parser. Rendered only while there's
        more to fetch, so a fully-loaded list has no observer attached and
        nothing left to trip.
      */}
      {hasMore && !error && (
        <tr ref={sentinelRef} aria-hidden="true">
          <td colSpan={columnCount} className="px-4 py-4 text-center text-sm text-ink-faint">
            {loading ? "Loading…" : ""}
          </td>
        </tr>
      )}
    </tbody>
  );
}
