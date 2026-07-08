"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addVatRate(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const rate = formData.get("rate") as string;

  const { error } = await supabase.from("vat_rates").insert({ name, rate });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/options");
}

export async function updateVatRate(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const rate = formData.get("rate") as string;

  const { error } = await supabase
    .from("vat_rates")
    .update({ name, rate })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/options");
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
  revalidatePath("/options");
}
