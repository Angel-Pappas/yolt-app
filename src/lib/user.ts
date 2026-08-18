import type { TypedSupabaseClient } from "@/lib/supabase/types";

export type CurrentUser = {
  email: string;
  /** From auth.users.raw_user_meta_data.full_name — unset until the user saves one in Account. */
  name: string | undefined;
};

/**
 * The single place that knows how to read the signed-in user's email and
 * display name off the JWT (via getClaims(), same call options/page.tsx
 * already made for email) — used by both the app shell (top bar/account
 * menu) and the Account page, so there's one spot instead of two copies
 * of the `data?.claims?....` reach-in.
 */
export async function getCurrentUser(supabase: TypedSupabaseClient): Promise<CurrentUser> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = (claims?.email as string | undefined) ?? "";
  const metadata = claims?.user_metadata as Record<string, unknown> | undefined;
  const name = typeof metadata?.full_name === "string" ? metadata.full_name : undefined;

  return { email, name };
}

export type UserProfile = {
  id: string;
  email: string;
  /** Display name, from profiles.full_name (the source of truth). */
  name: string | undefined;
  isAdmin: boolean;
  canAccessFinance: boolean;
  canAccessCrm: boolean;
  isActive: boolean;
};

/**
 * The single place the app reads the signed-in user's permission flags +
 * identity, from the `profiles` row (see the multi-user model). Used by the
 * app shell (which areas/menus to show) and by each area's layout guard.
 *
 * Returns null when there's no signed-in user or no profile row yet — callers
 * treat that as "no access" (the app shell redirects to login in that case).
 * The database RLS is the real lock; this only drives what the UI offers.
 */
export async function getProfile(
  supabase: TypedSupabaseClient
): Promise<UserProfile | null> {
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const id = claims?.sub as string | undefined;
  if (!id) return null;

  const email = (claims?.email as string | undefined) ?? "";
  // Display name stays in auth user_metadata (edited via the Account page),
  // same source getCurrentUser reads. `profiles` carries only the permission
  // flags. (profiles.full_name is seeded for future admin-side listing but is
  // not the display source.)
  const metadata = claims?.user_metadata as Record<string, unknown> | undefined;
  const name = typeof metadata?.full_name === "string" ? metadata.full_name : undefined;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin, can_access_finance, can_access_crm, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  return {
    id,
    email,
    name,
    isAdmin: data.is_admin,
    canAccessFinance: data.can_access_finance,
    canAccessCrm: data.can_access_crm,
    isActive: data.is_active,
  };
}
