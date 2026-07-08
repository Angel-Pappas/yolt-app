"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

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

function revalidateAffectedPaths() {
  revalidatePath("/transactions");
  revalidatePath("/wallets");
  revalidatePath("/wallets/[id]", "page");
  revalidatePath("/taxes");
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const description = formData.get("description") as string;
  const net = formData.get("net") as string;
  const entity_id = (formData.get("entity_id") as string) || null;
  const wallet_id = (formData.get("wallet_id") as string) || null;
  const vat_rate_id = formData.get("vat_rate_id") as string;

  const vat_amount = await resolveVatAmount(supabase, net, vat_rate_id);

  const { error } = await supabase.from("transactions").insert({
    date,
    description,
    net,
    entity_id,
    wallet_id,
    vat_rate_id,
    vat_amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAffectedPaths();
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const description = formData.get("description") as string;
  const net = formData.get("net") as string;
  const entity_id = (formData.get("entity_id") as string) || null;
  const wallet_id = (formData.get("wallet_id") as string) || null;
  const vat_rate_id = formData.get("vat_rate_id") as string;

  const vat_amount = await resolveVatAmount(supabase, net, vat_rate_id);

  const { error } = await supabase
    .from("transactions")
    .update({
      date,
      description,
      net,
      entity_id,
      wallet_id,
      vat_rate_id,
      vat_amount,
    })
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
