"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { formAction } from "@/lib/action-result";
import { leadStatusSchema } from "./schema";

export async function addLeadStatus(formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name } = parseOrThrow(leadStatusSchema, formDataToRecord(formData));

    const { error } = await supabase.from("lead_statuses").insert({ name });
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/settings/lead-statuses");
    revalidatePath("/leads");
  });
}

export async function updateLeadStatus(id: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name } = parseOrThrow(leadStatusSchema, formDataToRecord(formData));

    const { error } = await supabase
      .from("lead_statuses")
      .update({ name })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/settings/lead-statuses");
    revalidatePath("/leads");
  });
}

export async function deleteLeadStatus(id: string) {
  return formAction(async () => {
    const supabase = await createClient();

    // Soft delete only. A lead pointing at this status keeps its status_id null
    // (the FK is on delete set null) — leads are never lost when a status goes.
    const { error } = await supabase
      .from("lead_statuses")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/settings/lead-statuses");
    revalidatePath("/leads");
  });
}
