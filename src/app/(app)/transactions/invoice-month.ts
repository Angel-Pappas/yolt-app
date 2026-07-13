/**
 * Translates the Invoice modal's single 1-13 input (and the importer's
 * "Bacon" column, which uses the same 1-13 shape) into the two columns
 * actually stored: 13 means "confirmed, no invoice needed"
 * (invoice_not_required, invoice_month left null), 1-12 sets invoice_month
 * normally, and null/anything else clears both. See schema.ts's
 * invoiceMonthSchema for why this stays a single field in the UI.
 *
 * Deliberately not in actions.ts — every export from a "use server" file is
 * treated as a Server Action, and this is a plain synchronous helper, not
 * one itself (Next.js rejects a non-async export there).
 */
export function resolveInvoiceMonthInput(
  value: number | null
): { invoice_month: number | null; invoice_not_required: boolean } {
  if (value === 13) {
    return { invoice_month: null, invoice_not_required: true };
  }
  if (value !== null && value >= 1 && value <= 12) {
    return { invoice_month: value, invoice_not_required: false };
  }
  return { invoice_month: null, invoice_not_required: false };
}
