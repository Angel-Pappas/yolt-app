"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const amount = formData.get("amount") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("transactions").insert({
    date,
    amount,
    description,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const amount = formData.get("amount") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase
    .from("transactions")
    .update({ date, amount, description })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
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

  revalidatePath("/transactions");
}
