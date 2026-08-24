"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { formAction } from "@/lib/action-result";
import { projectStatusSchema } from "./schema";

export async function addProjectStatus(formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name } = parseOrThrow(projectStatusSchema, formDataToRecord(formData));

    const { error } = await supabase.from("project_statuses").insert({ name });
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/settings/project-statuses");
    revalidatePath("/projects");
  });
}

export async function updateProjectStatus(id: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name } = parseOrThrow(projectStatusSchema, formDataToRecord(formData));

    const { error } = await supabase
      .from("project_statuses")
      .update({ name })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/settings/project-statuses");
    revalidatePath("/projects");
  });
}

export async function deleteProjectStatus(id: string) {
  return formAction(async () => {
    const supabase = await createClient();

    // Soft delete only. A project pointing at this status keeps its status_id
    // null (the FK is on delete set null) — projects are never lost.
    const { error } = await supabase
      .from("project_statuses")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/settings/project-statuses");
    revalidatePath("/projects");
  });
}
