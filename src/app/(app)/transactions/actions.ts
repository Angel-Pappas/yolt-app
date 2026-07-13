"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { round2 } from "@/lib/format";
import { invoiceMonthSchema, reconcileSchema, transactionSchema } from "./schema";
import { resolveInvoiceMonthInput } from "./invoice-month";
import type { TransactionType } from "./queries";

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

/**
 * Defense-in-depth: the category combobox already only ever offers
 * categories matching the form's current income/expense type, so this
 * only fires on a bug, not a normal user flow — mirrors resolveVatAmount
 * fetching related-row data server-side rather than trusting the client.
 */
async function resolveCategoryId(
  supabase: SupabaseClient,
  categoryId: string | null,
  type: "income" | "expense"
): Promise<string | null> {
  if (!categoryId) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("type")
    .eq("id", categoryId)
    .single();

  if (error || !data) {
    throw new Error("Invalid category");
  }
  if (data.type !== type) {
    throw new Error(`That category is for ${data.type}, not ${type}`);
  }

  return categoryId;
}

type TransactionFields = {
  date: string;
  invoice_date: string;
  description: string;
  type: TransactionType;
  net: number;
  entity_id: string | null;
  category_id: string | null;
  wallet_id: string;
  to_wallet_id: string | null;
  vat_rate_id: string | null;
  vat_amount: number;
};

/** One resolved line of a (rare) multi-VAT-rate transaction — see transaction_vat_lines. vat_amount is computed server-side the same way the parent's is, never trusted from the client. */
type ResolvedLine = { net: number; vat_rate_id: string; vat_amount: number };

/**
 * Validates the form against transactionSchema (mirrors the
 * transactions_type_fields_check DB constraint — see schema.ts) and
 * resolves the fields to actually write. Income/expense use a single
 * wallet, an entity, and one or more amount lines (99% of the time
 * exactly one, occasionally more when one invoice mixes VAT rates — see
 * Summary.md); `fields.net`/`vat_amount` are always the *sum* across
 * those lines, and `fields.vat_rate_id` is only set when there's exactly
 * one (null — "mixed rates" — otherwise). A transfer moves money between
 * two of the user's own wallets with no entity/VAT/lines at all. The
 * "from" wallet reuses the plain `wallet_id` field so the form only ever
 * needs one Wallet/From-wallet select at a time.
 */
async function resolveFields(
  supabase: SupabaseClient,
  formData: FormData
): Promise<{ fields: TransactionFields; lines: ResolvedLine[] }> {
  const input = parseOrThrow(transactionSchema, formDataToRecord(formData));

  if (input.type === "transfer") {
    return {
      fields: {
        date: input.date,
        invoice_date: input.invoice_date,
        description: input.description,
        type: input.type,
        net: input.net,
        entity_id: null,
        category_id: null,
        wallet_id: input.wallet_id,
        to_wallet_id: input.to_wallet_id,
        vat_rate_id: null,
        vat_amount: 0,
      },
      lines: [],
    };
  }

  const [lines, category_id] = await Promise.all([
    Promise.all(
      input.lines.map(async (line) => ({
        net: line.net,
        vat_rate_id: line.vat_rate_id,
        vat_amount: await resolveVatAmount(supabase, line.net, line.vat_rate_id),
      }))
    ),
    resolveCategoryId(supabase, input.category_id, input.type),
  ]);

  const net = round2(lines.reduce((sum, l) => sum + l.net, 0));
  const vat_amount = round2(lines.reduce((sum, l) => sum + l.vat_amount, 0));

  return {
    fields: {
      date: input.date,
      invoice_date: input.invoice_date,
      description: input.description,
      type: input.type,
      net,
      entity_id: input.entity_id,
      category_id,
      wallet_id: input.wallet_id,
      to_wallet_id: null,
      vat_rate_id: lines.length === 1 ? lines[0].vat_rate_id : null,
      vat_amount,
    },
    lines,
  };
}

/** Replaces a transaction's amount-line breakdown wholesale — simplest correct way to keep transaction_vat_lines in sync with whatever was just submitted, and naturally handles a type change (income/expense <-> transfer) with no special-casing. */
async function writeLines(
  supabase: SupabaseClient,
  transactionId: string,
  lines: ResolvedLine[]
) {
  const { error: deleteError } = await supabase
    .from("transaction_vat_lines")
    .delete()
    .eq("transaction_id", transactionId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (lines.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("transaction_vat_lines").insert(
    lines.map((line, position) => ({
      transaction_id: transactionId,
      net: line.net,
      vat_rate_id: line.vat_rate_id,
      vat_amount: line.vat_amount,
      position,
    }))
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

function revalidateAffectedPaths() {
  revalidatePath("/transactions");
  revalidatePath("/wallets");
  revalidatePath("/taxes");
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  const { fields, lines } = await resolveFields(supabase, formData);

  const { data, error } = await supabase
    .from("transactions")
    .insert(fields)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add transaction");
  }

  try {
    await writeLines(supabase, data.id, lines);
  } catch (err) {
    // The parent row saved but its amount breakdown didn't — soft-delete it
    // rather than leave an orphaned transaction with no lines behind it
    // (there's no DELETE policy on transactions to hard-remove it, same as
    // everywhere else in the app — see Summary.md).
    await supabase
      .from("transactions")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    throw err;
  }

  revalidateAffectedPaths();
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { fields, lines } = await resolveFields(supabase, formData);

  const { error } = await supabase
    .from("transactions")
    .update(fields)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await writeLines(supabase, id, lines);

  revalidateAffectedPaths();
}

/**
 * The reconcile modal only lets the user correct date/amount/wallet(s) —
 * see reconcile-modal.tsx — but a changed amount on an income/expense
 * transaction still has to keep vat_amount (and, for a rare multi-line
 * transaction, each line's own net/vat_amount) consistent with it. Since
 * Reconcile only exposes a single flat amount field, a corrected total is
 * distributed across the existing lines proportionally to their current
 * share of the old net (so a transaction split 1000/200 that gets
 * corrected to 1100 becomes ~917/183, keeping each line's own rate) —
 * this keeps Reconcile working for the rare multi-line case without
 * needing its own line-editing UI. Transfers have no VAT/lines, so that
 * step is skipped for them. Always marks the row reconciled, even if
 * nothing actually changed — reconciling is itself the record that the
 * user checked it.
 */
export async function reconcileTransaction(id: string, formData: FormData) {
  const supabase = await createClient();
  const input = parseOrThrow(reconcileSchema, formDataToRecord(formData));

  let vat_amount: number | undefined;
  let netOverride: number | undefined;
  let to_wallet_id: string | undefined;

  if (input.type === "transfer") {
    to_wallet_id = input.to_wallet_id;
  } else {
    const { data: existingLines, error: linesError } = await supabase
      .from("transaction_vat_lines")
      .select("id, net, vat_rate_id")
      .eq("transaction_id", id);

    if (linesError) {
      throw new Error(linesError.message);
    }
    if (!existingLines || existingLines.length === 0) {
      throw new Error("Could not find this transaction's VAT breakdown");
    }

    const oldNet = existingLines.reduce((sum, l) => sum + Number(l.net), 0);
    const ratio = oldNet > 0 ? input.net / oldNet : 0;

    const rescaled = await Promise.all(
      existingLines.map(async (line, index) => {
        const lineNet =
          oldNet > 0
            ? round2(Number(line.net) * ratio)
            : index === 0
              ? input.net
              : 0;
        const lineVat = line.vat_rate_id
          ? await resolveVatAmount(supabase, lineNet, line.vat_rate_id)
          : 0;
        return { id: line.id, net: lineNet, vat_amount: lineVat };
      })
    );

    await Promise.all(
      rescaled.map((line) =>
        supabase
          .from("transaction_vat_lines")
          .update({ net: line.net, vat_amount: line.vat_amount })
          .eq("id", line.id)
      )
    );

    netOverride = round2(rescaled.reduce((sum, l) => sum + l.net, 0));
    vat_amount = round2(rescaled.reduce((sum, l) => sum + l.vat_amount, 0));
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      date: input.date,
      net: netOverride ?? input.net,
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
    .update(resolveInvoiceMonthInput(invoice_month))
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
