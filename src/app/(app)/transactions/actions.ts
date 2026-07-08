"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
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
  net: string,
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

  return round2((Number(net) * Number(data.rate)) / 100);
}

type TransactionFields = {
  date: string;
  description: string;
  type: TransactionType;
  net: string;
  entity_id: string | null;
  wallet_id: string;
  to_wallet_id: string | null;
  vat_rate_id: string | null;
  vat_amount: number;
};

/**
 * Income/expense use a single wallet, an entity, and a VAT rate. A
 * transfer moves money between two of the user's own wallets — no
 * entity, no VAT (see the transactions_type_fields_check DB constraint,
 * which mirrors this same split). The "from" wallet reuses the plain
 * `wallet_id` field so the form only ever needs one Wallet/From-wallet
 * select at a time.
 */
async function resolveFields(
  supabase: SupabaseClient,
  formData: FormData
): Promise<TransactionFields> {
  const date = formData.get("date") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as TransactionType;
  const net = formData.get("net") as string;
  const wallet_id = formData.get("wallet_id") as string;

  if (type === "transfer") {
    const to_wallet_id = formData.get("to_wallet_id") as string;

    if (!wallet_id || !to_wallet_id) {
      throw new Error("Pick both a from and a to wallet");
    }
    if (wallet_id === to_wallet_id) {
      throw new Error("From and to wallet must be different");
    }

    return {
      date,
      description,
      type,
      net,
      entity_id: null,
      wallet_id,
      to_wallet_id,
      vat_rate_id: null,
      vat_amount: 0,
    };
  }

  const entity_id = (formData.get("entity_id") as string) || null;
  const vat_rate_id = formData.get("vat_rate_id") as string;
  const vat_amount = await resolveVatAmount(supabase, net, vat_rate_id);

  return {
    date,
    description,
    type,
    net,
    entity_id,
    wallet_id,
    to_wallet_id: null,
    vat_rate_id,
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
