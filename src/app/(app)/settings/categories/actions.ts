"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { formAction } from "@/lib/action-result";
import { categorySchema } from "./schema";

export async function addCategory(formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name, type } = parseOrThrow(categorySchema, formDataToRecord(formData));

    const { error } = await supabase.from("categories").insert({ name, type });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/transactions");
    revalidatePath("/settings/categories");
  });
}

export async function updateCategory(id: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name, type } = parseOrThrow(categorySchema, formDataToRecord(formData));

    const { error } = await supabase
      .from("categories")
      .update({ name, type })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/transactions");
    revalidatePath("/settings/categories");
  });
}

export async function deleteCategory(id: string) {
  return formAction(async () => {
    const supabase = await createClient();

    // Soft delete only — nothing is ever permanently removed from the app.
    const { error } = await supabase
      .from("categories")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/transactions");
    revalidatePath("/settings/categories");
  });
}
