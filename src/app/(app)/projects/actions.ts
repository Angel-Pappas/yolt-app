"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formDataToRecord } from "@/lib/form-data";
import { parseOrThrow } from "@/lib/validation";
import { formAction } from "@/lib/action-result";
import { getProfile, type UserProfile } from "@/lib/user";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { projectSchema, projectActionSchema, convertLeadSchema } from "./schema";

// ---- projects --------------------------------------------------------------

export async function addProject(formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const fields = parseOrThrow(projectSchema, formDataToRecord(formData));

    const { error } = await supabase.from("projects").insert(fields);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/projects");
  });
}

export async function updateProject(id: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const fields = parseOrThrow(projectSchema, formDataToRecord(formData));

    const { error } = await supabase.from("projects").update(fields).eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
  });
}

export async function deleteProject(id: string) {
  return formAction(async () => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("projects")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/projects");
  });
}

/** Update just the next step — used by the inline edit on the projects list. */
export async function updateProjectNextStep(projectId: string, value: string) {
  const supabase = await createClient();
  const next = value.trim() || null;

  const { error } = await supabase
    .from("projects")
    .update({ next_step: next })
    .eq("id", projectId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

/** Update just the status — used by the inline dropdown on the projects list. */
export async function updateProjectStatus(
  projectId: string,
  statusId: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ status_id: statusId })
    .eq("id", projectId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

// ---- lead → project conversion ---------------------------------------------

/**
 * Create a project from a lead: the user is prompted for the project name only
 * (everything client-side lives on the lead, never copied). The lead is then
 * marked done by setting its status to the flagged "conversion" lead status,
 * which drops it out of the active leads list. Redirects to the new project.
 */
export async function convertLeadToProject(leadId: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const { name } = parseOrThrow(convertLeadSchema, formDataToRecord(formData));

    // The single lead status flagged as the conversion/done state.
    const { data: conversion } = await supabase
      .from("lead_statuses")
      .select("id")
      .eq("is_conversion", true)
      .eq("is_deleted", false)
      .maybeSingle();

    const { data: created, error: insertError } = await supabase
      .from("projects")
      .insert({ name, lead_id: leadId })
      .select("id")
      .single();
    if (insertError || !created) {
      throw new Error(insertError?.message ?? "Could not create the project");
    }

    if (conversion?.id) {
      const { error: leadError } = await supabase
        .from("leads")
        .update({ status_id: conversion.id })
        .eq("id", leadId);
      if (leadError) {
        throw new Error(leadError.message);
      }
    }

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/projects");
    redirect(`/projects/${created.id}`);
  });
}

// ---- actions (the History sub-tab) -----------------------------------------

async function requireCrmProfile(
  supabase: TypedSupabaseClient
): Promise<UserProfile> {
  const profile = await getProfile(supabase);
  if (!profile || !profile.canAccessCrm) {
    throw new Error("You don't have access to the CRM");
  }
  return profile;
}

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

export async function addProjectAction(projectId: string, formData: FormData) {
  return formAction(async () => {
    const supabase = await createClient();
    const profile = await requireCrmProfile(supabase);
    const { body, action_date, user_id } = parseOrThrow(
      projectActionSchema,
      formDataToRecord(formData)
    );
    const actor = await resolveActor(supabase, profile, user_id);

    const { error } = await supabase.from("project_actions").insert({
      project_id: projectId,
      body,
      action_date,
      user_id: actor.userId,
      author_name: actor.name,
    });
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
  });
}

export async function updateProjectAction(
  id: string,
  projectId: string,
  formData: FormData
) {
  return formAction(async () => {
    const supabase = await createClient();
    const profile = await requireCrmProfile(supabase);
    const { body, action_date, user_id } = parseOrThrow(
      projectActionSchema,
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
      .from("project_actions")
      .update(update)
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
  });
}

export async function deleteProjectAction(id: string, projectId: string) {
  return formAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("project_actions")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/projects/${projectId}`);
  });
}
