"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "../../require-access";

/**
 * Invite a new user by email. Creates the auth user (invited state) and sends
 * the invite link, then sets their access flags on the profile the
 * auto-provision trigger created. Admin-only.
 */
export async function inviteUser(formData: FormData) {
  await requireAdmin();

  const email = (formData.get("email") as string | null)?.trim();
  if (!email) {
    throw new Error("Email is required");
  }
  const canFinance = formData.get("can_access_finance") != null;
  const canCrm = formData.get("can_access_crm") != null;

  const origin = (await headers()).get("origin");
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/set-password`,
  });
  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user?.id;
  if (userId) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        email,
        can_access_finance: canFinance,
        can_access_crm: canCrm,
        is_active: true,
      })
      .eq("id", userId);
    if (profileError) {
      throw new Error(profileError.message);
    }
  }

  revalidatePath("/settings/users");
}

/**
 * Change a user's access flags. Admin-only, and guards against an admin locking
 * themselves out (removing their own admin, or deactivating themselves).
 */
export async function updateUserAccess(userId: string, formData: FormData) {
  const me = await requireAdmin();

  const canFinance = formData.get("can_access_finance") != null;
  const canCrm = formData.get("can_access_crm") != null;
  const isAdmin = formData.get("is_admin") != null;
  const isActive = formData.get("is_active") != null;

  if (userId === me.id && (!isAdmin || !isActive)) {
    throw new Error(
      "You can't remove your own admin access or deactivate your own account."
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      can_access_finance: canFinance,
      can_access_crm: canCrm,
      is_admin: isAdmin,
      is_active: isActive,
    })
    .eq("id", userId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings/users");
}
