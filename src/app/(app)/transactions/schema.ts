import { z } from "zod";

/** Empty string -> null, otherwise must be a valid UUID. For optional FK fields submitted from a form (always present as a string, possibly empty). */
function optionalUuid(message: string) {
  return z
    .string()
    .transform((v) => (v.trim() ? v.trim() : null))
    .pipe(z.uuid(message).nullable());
}

const vatLineSchema = z.object({
  net: z.coerce.number().min(0, "Amount must be zero or greater"),
  vat_rate_id: z.uuid("Choose a VAT rate"),
  /**
   * The original total this line was entered as (Total mode) — null when
   * entered as a net (Net mode). When present, the server anchors
   * vat_amount to `total - net` instead of independently deriving it from
   * `net * rate`, since net was itself already rounded from total/rate;
   * deriving vat_amount from the rounded net a second time can drift the
   * reconstructed total by a cent. See resolveLineVatAmount() in actions.ts.
   */
  total: z.number().min(0).nullable(),
});

/**
 * The client serializes its amount lines (see transaction-form-dialog.tsx —
 * 99% of transactions have exactly one, but a rare invoice mixing VAT rates
 * can have more) as a single JSON form field rather than bracket-notation
 * field names, since FormData has no native array/object support and this
 * avoids hand-rolling that parsing.
 */
const linesField = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid amount lines" });
      return z.NEVER;
    }
  })
  .pipe(z.array(vatLineSchema).min(1, "Add at least one amount"));

const incomeExpenseFields = {
  date: z.iso.date("Invalid date"),
  invoice_date: z.iso.date("Invalid invoice date"),
  description: z.string().trim().min(1, "Description is required"),
  lines: linesField,
  entity_id: optionalUuid("Invalid entity"),
  category_id: optionalUuid("Invalid category"),
  wallet_id: z.uuid("Choose a wallet"),
};

const incomeSchema = z.object({ type: z.literal("income"), ...incomeExpenseFields });
const expenseSchema = z.object({ type: z.literal("expense"), ...incomeExpenseFields });
const transferSchema = z.object({
  type: z.literal("transfer"),
  date: z.iso.date("Invalid date"),
  invoice_date: z.iso.date("Invalid invoice date"),
  description: z.string().trim().min(1, "Description is required"),
  net: z.coerce.number().min(0, "Amount must be zero or greater"),
  wallet_id: z.uuid("Choose a from wallet"),
  to_wallet_id: z.uuid("Choose a to wallet"),
});

/**
 * Mirrors the transactions_type_fields_check DB constraint at the app
 * layer: income/expense need a wallet + VAT rate, transfer needs two
 * distinct wallets and nothing else. Validating here means a bad
 * request fails with a clear message immediately, instead of only as a
 * raw Postgres constraint-violation error round-tripped from the DB.
 */
export const transactionSchema = z
  .discriminatedUnion("type", [incomeSchema, expenseSchema, transferSchema])
  .refine(
    (data) => data.type !== "transfer" || data.wallet_id !== data.to_wallet_id,
    { message: "From and to wallet must be different", path: ["to_wallet_id"] }
  );

export type TransactionInput = z.infer<typeof transactionSchema>;

const reconcileIncomeExpenseFields = {
  date: z.iso.date("Invalid date"),
  net: z.coerce.number().min(0, "Amount must be zero or greater"),
  wallet_id: z.uuid("Choose a wallet"),
};

const reconcileIncomeSchema = z.object({
  type: z.literal("income"),
  ...reconcileIncomeExpenseFields,
});
const reconcileExpenseSchema = z.object({
  type: z.literal("expense"),
  ...reconcileIncomeExpenseFields,
});
const reconcileTransferSchema = z.object({
  type: z.literal("transfer"),
  date: z.iso.date("Invalid date"),
  net: z.coerce.number().min(0, "Amount must be zero or greater"),
  wallet_id: z.uuid("Choose a from wallet"),
  to_wallet_id: z.uuid("Choose a to wallet"),
});

/**
 * The reconcile modal only ever edits date/amount/wallet(s) — never
 * description/entity/VAT rate — so this is deliberately a reduced
 * sibling of transactionSchema above, not a reuse of it.
 */
export const reconcileSchema = z
  .discriminatedUnion("type", [
    reconcileIncomeSchema,
    reconcileExpenseSchema,
    reconcileTransferSchema,
  ])
  .refine(
    (data) => data.type !== "transfer" || data.wallet_id !== data.to_wallet_id,
    { message: "From and to wallet must be different", path: ["to_wallet_id"] }
  );

export type ReconcileInput = z.infer<typeof reconcileSchema>;

/**
 * Empty string -> null, otherwise 1-13. 13 is a UI-only shorthand for
 * "confirmed, no invoice needed" — a single field keeps the fast
 * press-type-Enter flow instead of a second control, but 13 is translated
 * into the separate `invoice_not_required` column before it's ever stored
 * (see resolveInvoiceMonthInput() in actions.ts) — the database never has
 * a fake "month 13" sitting in a column that otherwise always means 1-12.
 */
export const invoiceMonthSchema = z.object({
  invoice_month: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .pipe(
      z
        .number()
        .int("Enter a whole number")
        .min(1, 'Enter a month from 1 to 12, or 13 for "not needed"')
        .max(13, 'Enter a month from 1 to 12, or 13 for "not needed"')
        .nullable()
    ),
});
