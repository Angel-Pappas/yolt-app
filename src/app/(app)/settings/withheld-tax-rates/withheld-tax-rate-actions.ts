"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { withheldTaxRateSchema } from "./withheld-tax-rate-schema";

export async function addWithheldTaxRate(formData: FormData) {
  const supabase = await createClient();
  const { name, rate } = parseOrThrow(withheldTaxRateSchema, formDataToRecord(formData));

  const { error } = await supabase.from("withheld_tax_rates").insert({ name, rate });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/settings/withheld-tax-rates");
}

export async function updateWithheldTaxRate(id: string, formData: FormData) {
  const supabase = await createClient();
  const { name, rate } = parseOrThrow(withheldTaxRateSchema, formDataToRecord(formData));

  const { error } = await supabase
    .from("withheld_tax_rates")
    .update({ name, rate })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/settings/withheld-tax-rates");
}

export async function deleteWithheldTaxRate(id: string) {
  const supabase = await createClient();

  // Soft delete only — nothing is ever permanently removed from the app.
  const { error } = await supabase
    .from("withheld_tax_rates")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/settings/withheld-tax-rates");
}
