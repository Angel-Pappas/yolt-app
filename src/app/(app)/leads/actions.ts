"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { getCurrentUser } from "@/lib/user";
import { leadSchema } from "./schema";

export async function addLead(formData: FormData) {
  const supabase = await createClient();
  const fields = parseOrThrow(leadSchema, formDataToRecord(formData));

  const { error } = await supabase.from("leads").insert(fields);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/leads");
}

export async function updateLead(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = parseOrThrow(leadSchema, formDataToRecord(formData));

  const { error } = await supabase.from("leads").update(fields).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function deleteLead(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/leads");
}

/**
 * Append an entry to a lead's activity log. The author's display name is stored
 * on the row at write time (see the phase-4 migration) so a colleague can see
 * who logged it without needing to read another user's profile.
 */
export async function addLeadActivity(leadId: string, body: string) {
  const supabase = await createClient();
  const text = body.trim();
  if (!text) {
    throw new Error("Write something before logging it");
  }

  const { name, email } = await getCurrentUser(supabase);
  const author = name || email || null;

  const { error } = await supabase
    .from("lead_activities")
    .insert({ lead_id: leadId, body: text, author_name: author });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLeadActivity(id: string, leadId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lead_activities")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/leads/${leadId}`);
}
