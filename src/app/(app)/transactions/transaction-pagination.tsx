"use client";

import { useTransactionParams } from "./use-transaction-params";

export function TransactionPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const { setPage } = useTransactionParams();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-faint">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:border-edge-strong hover:text-ink disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-ink-muted"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:border-edge-strong hover:text-ink disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-ink-muted"
        >
          Next
        </button>
      </div>
    </div>
  );
}
