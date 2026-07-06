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

  revalidatePath("/");
}
