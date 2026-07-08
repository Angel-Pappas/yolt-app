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
  description: z.string().trim().min(1, "Description is required"),
  net: z.coerce.number().min(0, "Net must be zero or greater"),
  entity_id: optionalUuid("Invalid entity"),
  wallet_id: z.uuid("Choose a wallet"),
  vat_rate_id: z.uuid("Choose a VAT rate"),
};

const incomeSchema = z.object({ type: z.literal("income"), ...incomeExpenseFields });
const expenseSchema = z.object({ type: z.literal("expense"), ...incomeExpenseFields });
const transferSchema = z.object({
  type: z.literal("transfer"),
  date: z.iso.date("Invalid date"),
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
