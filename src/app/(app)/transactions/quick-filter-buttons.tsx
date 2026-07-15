"use client";

import { ReconcileIcon, InvoiceIcon } from "@/components/icons";
import { useListParams } from "@/components/table/use-list-params";

/**
 * Two additive quick-filter toggles next to the date range — narrow the
 * current (date-filtered) list down to "still needs work" rows: not yet
 * reconciled, or not yet invoiced. Same icons as the per-row Reconcile/
 * Invoice buttons, same lit colors, so the meaning carries over.
 */
export function TransactionQuickFilters() {
  const { searchParams, setFilterParams } = useListParams();
  const unreconciledOnly = searchParams.get("unreconciled") === "1";
  const missingInvoiceOnly = searchParams.get("no_invoice") === "1";

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-edge bg-canvas p-0.5">
      <button
        type="button"
        onClick={() =>
          setFilterParams({ unreconciled: unreconciledOnly ? null : "1" })
        }
        aria-pressed={unreconciledOnly}
        aria-label={
          unreconciledOnly
            ? "Showing unreconciled transactions only — click to show all"
            : "Show only unreconciled transactions"
        }
        title="Show only unreconciled transactions"
        className={`rounded-md p-1.5 transition ${
          unreconciledOnly
            ? "bg-success-soft text-success"
            : "text-ink-faint hover:bg-surface-raised hover:text-ink"
        }`}
      >
        <ReconcileIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() =>
          setFilterParams({ no_invoice: missingInvoiceOnly ? null : "1" })
        }
        aria-pressed={missingInvoiceOnly}
        aria-label={
          missingInvoiceOnly
            ? "Showing transactions missing an invoice only — click to show all"
            : "Show only transactions missing an invoice"
        }
        title="Show only transactions missing an invoice"
        className={`rounded-md p-1.5 transition ${
          missingInvoiceOnly
            ? "bg-accent-soft text-accent"
            : "text-ink-faint hover:bg-surface-raised hover:text-ink"
        }`}
      >
        <InvoiceIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
