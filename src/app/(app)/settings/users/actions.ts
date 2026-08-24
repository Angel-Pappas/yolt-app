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
export async function inviteUser(
  formData: FormData
): Promise<{ error?: string } | void> {
  await requireAdmin();

  const email = (formData.get("email") as string | null)?.trim();
  if (!email) {
    return { error: "Email is required" };
  }
  const canFinance = formData.get("can_access_finance") != null;
  const canCrm = formData.get("can_access_crm") != null;

  const origin = (await headers()).get("origin");
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/set-password`,
  });
  // Return (not throw) known, user-actionable failures: Next.js sanitizes
  // thrown Server Action errors in production, so a thrown message reaches the
  // UI as a generic "an error occurred… digest" — a returned value survives.
  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return {
        error:
          "Email sending limit reached — too many invites were sent recently. Please wait a while (about an hour) and try again.",
      };
    }
    if (
      error.code === "email_exists" ||
      error.message.toLowerCase().includes("already been registered")
    ) {
      return { error: "That email is already registered." };
    }
    return { error: error.message };
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
      return { error: profileError.message };
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
