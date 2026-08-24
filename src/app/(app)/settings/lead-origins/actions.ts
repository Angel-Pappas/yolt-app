"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { formAction } from "@/lib/action-result";
import { leadOriginSchema } from "./schema";

function revalidate() {
  revalidatePath("/settings/lead-origins");
  // The lead form's origin picker reads this list.
  revalidatePath("/leads");
  revalidatePath("/leads/[id]", "page");
}

export async function addLeadOrigin(formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name } = parseOrThrow(leadOriginSchema, formDataToRecord(formData));

    const { error } = await supabase.from("lead_origins").insert({ name });
    if (error) {
      throw new Error(error.message);
    }
    revalidate();
  });
}

export async function updateLeadOrigin(id: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name } = parseOrThrow(leadOriginSchema, formDataToRecord(formData));

    const { error } = await supabase
      .from("lead_origins")
      .update({ name })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
    revalidate();
  });
}

export async function deleteLeadOrigin(id: string) {
  return formAction(async () => {
    const supabase = await createClient();

    // Soft delete; a lead pointing here keeps origin_id null (FK on delete set null).
    const { error } = await supabase
      .from("lead_origins")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
    revalidate();
  });
}
