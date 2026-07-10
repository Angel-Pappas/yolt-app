"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { vatRateSchema } from "./vat-rate-schema";

export async function addVatRate(formData: FormData) {
  const supabase = await createClient();
  const { name, rate } = parseOrThrow(vatRateSchema, formDataToRecord(formData));

  const { error } = await supabase.from("vat_rates").insert({ name, rate });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/lists/vat-rates");
}

export async function updateVatRate(id: string, formData: FormData) {
  const supabase = await createClient();
  const { name, rate } = parseOrThrow(vatRateSchema, formDataToRecord(formData));

  const { error } = await supabase
    .from("vat_rates")
    .update({ name, rate })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/lists/vat-rates");
}

export async function deleteVatRate(id: string) {
  const supabase = await createClient();

  // Soft delete only — nothing is ever permanently removed from the app.
  const { error } = await supabase
    .from("vat_rates")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/lists/vat-rates");
}
