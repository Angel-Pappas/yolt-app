"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { formAction } from "@/lib/action-result";
import { requireCrmProfile, resolveActor } from "@/lib/crm";
import { leadSchema, leadContactSchema, leadActionSchema } from "./schema";

// ---- leads -----------------------------------------------------------------

export async function addLead(formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const fields = parseOrThrow(leadSchema, formDataToRecord(formData));

    const { error } = await supabase.from("leads").insert(fields);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/leads");
  });
}

export async function updateLead(id: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const fields = parseOrThrow(leadSchema, formDataToRecord(formData));

    const { error } = await supabase.from("leads").update(fields).eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
  });
}

export async function deleteLead(id: string) {
  return formAction(async () => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("leads")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/leads");
  });
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

/** Update just the status — used by the inline dropdown on the leads list. */
export async function updateLeadStatus(leadId: string, statusId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status_id: statusId })
    .eq("id", leadId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

// ---- actions (the History sub-tab) -----------------------------------------

export async function addLeadAction(leadId: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const profile = await requireCrmProfile(supabase);
    const { body, action_date, user_id } = parseOrThrow(
      leadActionSchema,
      formDataToRecord(formData)
    );
    const actor = await resolveActor(supabase, profile, user_id);

    const { error } = await supabase.from("lead_actions").insert({
      lead_id: leadId,
      body,
      action_date,
      user_id: actor.userId,
      author_name: actor.name,
    });
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/leads/${leadId}`);
  });
}

export async function updateLeadAction(
  id: string,
  leadId: string,
  formData: FormData
) {
  return formAction(async () => {
    const supabase = await createClient();
    const profile = await requireCrmProfile(supabase);
    const { body, action_date, user_id } = parseOrThrow(
      leadActionSchema,
      formDataToRecord(formData)
    );

    const update: {
      body: string;
      action_date: string;
      user_id?: string;
      author_name?: string | null;
    } = {
      body,
      action_date,
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
  });
}

export async function deleteLeadAction(id: string, leadId: string) {
  return formAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("lead_actions")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/leads/${leadId}`);
  });
}

// ---- contacts (the Contacts sub-tab) ---------------------------------------

export async function addLeadContact(leadId: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const fields = parseOrThrow(leadContactSchema, formDataToRecord(formData));

    const { error } = await supabase
      .from("lead_contacts")
      .insert({ lead_id: leadId, ...fields });
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/leads/${leadId}`);
  });
}

export async function updateLeadContact(
  id: string,
  leadId: string,
  formData: FormData
) {
  return formAction(async () => {
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
  });
}

export async function deleteLeadContact(id: string, leadId: string) {
  return formAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("lead_contacts")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/leads/${leadId}`);
  });
}
