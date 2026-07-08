"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { entitySchema } from "./schema";

export async function addEntity(formData: FormData) {
  const supabase = await createClient();
  const { name, vat_number } = parseOrThrow(
    entitySchema,
    formDataToRecord(formData)
  );

  const { error } = await supabase.from("entities").insert({
    name,
    vat_number,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/entities");
}

export async function updateEntity(id: string, formData: FormData) {
  const supabase = await createClient();
  const { name, vat_number } = parseOrThrow(
    entitySchema,
    formDataToRecord(formData)
  );

  const { error } = await supabase
    .from("entities")
    .update({ name, vat_number })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/entities");
}

export async function deleteEntity(id: string) {
  const supabase = await createClient();

  // Soft delete only — nothing is ever permanently removed from the app.
  const { error } = await supabase
    .from("entities")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/entities");
}
