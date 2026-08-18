"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { getProfile, type UserProfile } from "@/lib/user";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { leadSchema, leadContactSchema, leadActionSchema } from "./schema";

// ---- leads -----------------------------------------------------------------

/** Creates a lead and returns its id (the caller navigates to its edit page). */
export async function addLead(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const fields = parseOrThrow(leadSchema, formDataToRecord(formData));

  const { data, error } = await supabase
    .from("leads")
    .insert(fields)
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/leads");
  return data.id;
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

/** Update just the next step — used by the inline edit on the leads list. */
export async function updateLeadNextStep(leadId: string, value: string) {
  const supabase = await createClient();
  const next = value.trim() || null;

  const { error } = await supabase
    .from("leads")
    .update({ next_step: next })
    .eq("id", leadId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

// ---- actions (the History sub-tab) -----------------------------------------

/**
 * Resolve who an action is attributed to. A non-admin can only ever be
 * themselves; an admin may attribute it to any user. The actor's display name is
 * denormalized onto the row (author_name) so colleagues can see it without
 * reading another user's profile.
 */
async function resolveActor(
  supabase: TypedSupabaseClient,
  profile: UserProfile,
  submittedUserId: string | null
): Promise<{ userId: string; name: string | null }> {
  if (!profile.isAdmin || !submittedUserId || submittedUserId === profile.id) {
    return { userId: profile.id, name: profile.name || profile.email || null };
  }
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", submittedUserId)
    .maybeSingle();
  return {
    userId: submittedUserId,
    name: data?.full_name || data?.email || null,
  };
}

async function requireCrmProfile(
  supabase: TypedSupabaseClient
): Promise<UserProfile> {
  const profile = await getProfile(supabase);
  if (!profile || !profile.canAccessCrm) {
    throw new Error("You don't have access to the CRM");
  }
  return profile;
}

export async function addLeadAction(leadId: string, formData: FormData) {
  const supabase = await createClient();
  const profile = await requireCrmProfile(supabase);
  const { body, user_id } = parseOrThrow(
    leadActionSchema,
    formDataToRecord(formData)
  );
  const actor = await resolveActor(supabase, profile, user_id);

  const { error } = await supabase.from("lead_actions").insert({
    lead_id: leadId,
    body,
    user_id: actor.userId,
    author_name: actor.name,
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function updateLeadAction(
  id: string,
  leadId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const profile = await requireCrmProfile(supabase);
  const { body, user_id } = parseOrThrow(
    leadActionSchema,
    formDataToRecord(formData)
  );

  const update: { body: string; user_id?: string; author_name?: string | null } = {
    body,
  };
  // Only admins can reassign the actor.
  if (profile.isAdmin && user_id) {
    const actor = await resolveActor(supabase, profile, user_id);
    update.user_id = actor.userId;
    update.author_name = actor.name;
  }

  const { error } = await supabase
    .from("lead_actions")
    .update(update)
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLeadAction(id: string, leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_actions")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/leads/${leadId}`);
}

// ---- contacts (the Contacts sub-tab) ---------------------------------------

export async function addLeadContact(leadId: string, formData: FormData) {
  const supabase = await createClient();
  const fields = parseOrThrow(leadContactSchema, formDataToRecord(formData));

  const { error } = await supabase
    .from("lead_contacts")
    .insert({ lead_id: leadId, ...fields });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function updateLeadContact(
  id: string,
  leadId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const fields = parseOrThrow(leadContactSchema, formDataToRecord(formData));

  const { error } = await supabase
    .from("lead_contacts")
    .update(fields)
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLeadContact(id: string, leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_contacts")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/leads/${leadId}`);
}
