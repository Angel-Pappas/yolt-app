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
      <span className="text-neutral-500">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
