import { z } from "zod";

/** Empty string -> null, otherwise must be a valid UUID. For optional FK fields submitted from a form (always present as a string, possibly empty). */
function optionalUuid(message: string) {
  return z
    .string()
    .transform((v) => (v.trim() ? v.trim() : null))
    .pipe(z.uuid(message).nullable());
}

const incomeExpenseFields = {
  date: z.iso.date("Invalid date"),
  invoice_date: z.iso.date("Invalid invoice date"),
  description: z.string().trim().min(1, "Description is required"),
  net: z.coerce.number().min(0, "Net must be zero or greater"),
  entity_id: optionalUuid("Invalid entity"),
  category_id: optionalUuid("Invalid category"),
  wallet_id: z.uuid("Choose a wallet"),
  vat_rate_id: z.uuid("Choose a VAT rate"),
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

/** Empty string -> null (clears the invoice month), otherwise 1-12. */
export const invoiceMonthSchema = z.object({
  invoice_month: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .pipe(
      z
        .number()
        .int("Enter a whole month number")
        .min(1, "Enter a month from 1 to 12")
        .max(12, "Enter a month from 1 to 12")
        .nullable()
    ),
});
