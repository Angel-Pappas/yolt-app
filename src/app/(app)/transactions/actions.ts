"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { invoiceMonthSchema, reconcileSchema, transactionSchema } from "./schema";
import type { TransactionType } from "./queries";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * VAT amount is computed and stored server-side from the rate's current
 * percentage at the moment of save — never trusted from the client, and
 * never recomputed later from a possibly-since-edited rate. This is what
 * keeps past transactions historically accurate if a VAT rate's
 * percentage is changed afterwards.
 */
async function resolveVatAmount(
  supabase: SupabaseClient,
  net: number,
  vatRateId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("vat_rates")
    .select("rate")
    .eq("id", vatRateId)
    .single();

  if (error || !data) {
    throw new Error("Invalid VAT rate");
  }

  return round2((net * Number(data.rate)) / 100);
}

type TransactionFields = {
  date: string;
  description: string;
  type: TransactionType;
  net: number;
  entity_id: string | null;
  wallet_id: string;
  to_wallet_id: string | null;
  vat_rate_id: string | null;
  vat_amount: number;
};

/**
 * Validates the form against transactionSchema (mirrors the
 * transactions_type_fields_check DB constraint — see schema.ts) and
 * resolves the fields to actually write. Income/expense use a single
 * wallet, an entity, and a VAT rate; a transfer moves money between two
 * of the user's own wallets with no entity/VAT. The "from" wallet reuses
 * the plain `wallet_id` field so the form only ever needs one
 * Wallet/From-wallet select at a time.
 */
async function resolveFields(
  supabase: SupabaseClient,
  formData: FormData
): Promise<TransactionFields> {
  const input = parseOrThrow(transactionSchema, formDataToRecord(formData));

  if (input.type === "transfer") {
    return {
      date: input.date,
      description: input.description,
      type: input.type,
      net: input.net,
      entity_id: null,
      wallet_id: input.wallet_id,
      to_wallet_id: input.to_wallet_id,
      vat_rate_id: null,
      vat_amount: 0,
    };
  }

  const vat_amount = await resolveVatAmount(
    supabase,
    input.net,
    input.vat_rate_id
  );

  return {
    date: input.date,
    description: input.description,
    type: input.type,
    net: input.net,
    entity_id: input.entity_id,
    wallet_id: input.wallet_id,
    to_wallet_id: null,
    vat_rate_id: input.vat_rate_id,
    vat_amount,
  };
}

function revalidateAffectedPaths() {
  revalidatePath("/transactions");
  revalidatePath("/wallets");
  revalidatePath("/wallets/[id]", "page");
  revalidatePath("/taxes");
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  const fields = await resolveFields(supabase, formData);

  const { error } = await supabase.from("transactions").insert(fields);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAffectedPaths();
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = await resolveFields(supabase, formData);

  const { error } = await supabase
    .from("transactions")
    .update(fields)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAffectedPaths();
}

/**
 * The reconcile modal only lets the user correct date/amount/wallet(s) —
 * see reconcile-modal.tsx — but a changed amount on an income/expense
 * transaction still has to keep vat_amount consistent with it (same
 * invariant resolveVatAmount enforces on a normal edit), so this
 * recomputes it from the transaction's existing vat_rate_id rather than
 * leaving a stale value. Transfers have no VAT, so that step is skipped
 * for them. Always marks the row reconciled, even if nothing actually
 * changed — reconciling is itself the record that the user checked it.
 */
export async function reconcileTransaction(id: string, formData: FormData) {
  const supabase = await createClient();
  const input = parseOrThrow(reconcileSchema, formDataToRecord(formData));

  let vat_amount: number | undefined;
  let to_wallet_id: string | undefined;

  if (input.type === "transfer") {
    to_wallet_id = input.to_wallet_id;
  } else {
    const { data: existing, error: fetchError } = await supabase
      .from("transactions")
      .select("vat_rate_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing?.vat_rate_id) {
      throw new Error("Could not find this transaction's VAT rate");
    }

    vat_amount = await resolveVatAmount(supabase, input.net, existing.vat_rate_id);
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      date: input.date,
      net: input.net,
      wallet_id: input.wallet_id,
      is_reconciled: true,
      ...(to_wallet_id !== undefined ? { to_wallet_id } : {}),
      ...(vat_amount !== undefined ? { vat_amount } : {}),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAffectedPaths();
}

export async function setInvoiceMonth(id: string, formData: FormData) {
  const supabase = await createClient();
  const { invoice_month } = parseOrThrow(
    invoiceMonthSchema,
    formDataToRecord(formData)
  );

  const { error } = await supabase
    .from("transactions")
    .update({ invoice_month })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAffectedPaths();
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();

  // Soft delete only — nothing is ever permanently removed from the app.
  const { error } = await supabase
    .from("transactions")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAffectedPaths();
}
