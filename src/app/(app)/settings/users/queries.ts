import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ManagedUser = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  canAccessFinance: boolean;
  canAccessCrm: boolean;
  isActive: boolean;
  /** Invited but hasn't accepted yet (never signed in). */
  invitePending: boolean;
};

/**
 * Every user in the company, combining the auth record (email, sign-in status)
 * with their profile (permission flags). Admin-only — uses the service-role
 * client, so callers MUST guard with requireAdmin() first.
 */
export async function getManagedUsers(): Promise<ManagedUser[]> {
  const admin = createAdminClient();

  const [{ data: list, error: listError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin
        .from("profiles")
        .select(
          "id, full_name, is_admin, can_access_finance, can_access_crm, is_active"
        ),
    ]);

  if (listError) throw new Error(listError.message);
  if (profilesError) throw new Error(profilesError.message);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return list.users
    .map((u): ManagedUser => {
      const p = byId.get(u.id);
      const metadataName =
        typeof u.user_metadata?.full_name === "string"
          ? (u.user_metadata.full_name as string)
          : null;
      return {
        id: u.id,
        email: u.email ?? "",
        name: p?.full_name ?? metadataName,
        isAdmin: p?.is_admin ?? false,
        canAccessFinance: p?.can_access_finance ?? false,
        canAccessCrm: p?.can_access_crm ?? false,
        isActive: p?.is_active ?? true,
        invitePending: !u.last_sign_in_at,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));
}
