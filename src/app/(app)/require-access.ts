import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, type UserProfile } from "@/lib/user";

/**
 * Server-side access guards for area/admin pages. The database RLS is the real
 * lock (a user without finance access simply can't read finance rows); these
 * give a clean redirect instead of an empty/broken page, and keep pages a user
 * shouldn't see out of reach. Call at the very top of a page's Server
 * Component, before any data fetch.
 *
 * A signed-out or deactivated user goes to /login; a signed-in user lacking the
 * specific access goes to "/" (the launcher, which shows what they *can* reach).
 */

export async function requireProfile(): Promise<UserProfile> {
  const supabase = await createClient();
  const profile = await getProfile(supabase);
  if (!profile || !profile.isActive) redirect("/login");
  return profile;
}

export async function requireFinance(): Promise<UserProfile> {
  const profile = await requireProfile();
  if (!profile.canAccessFinance) redirect("/");
  return profile;
}

export async function requireCrm(): Promise<UserProfile> {
  const profile = await requireProfile();
  if (!profile.canAccessCrm) redirect("/");
  return profile;
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await requireProfile();
  if (!profile.isAdmin) redirect("/");
  return profile;
}
