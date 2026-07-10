"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { walletSchema } from "./schema";

export async function addWallet(formData: FormData) {
  const supabase = await createClient();
  const { name } = parseOrThrow(walletSchema, formDataToRecord(formData));

  const { error } = await supabase.from("wallets").insert({ name });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/wallets");
}

export async function updateWallet(id: string, formData: FormData) {
  const supabase = await createClient();
  const { name } = parseOrThrow(walletSchema, formDataToRecord(formData));

  const { error } = await supabase
    .from("wallets")
    .update({ name })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/wallets");
}

export async function deleteWallet(id: string) {
  const supabase = await createClient();

  // Soft delete only — nothing is ever permanently removed from the app.
  const { error } = await supabase
    .from("wallets")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/wallets");
}
