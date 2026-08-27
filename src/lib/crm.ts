import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { getProfile, type UserProfile } from "@/lib/user";

/**
 * Ensure the caller has CRM access, returning their profile. Used by the Leads
 * and Projects action logs (the History sub-tabs) to gate writes server-side.
 */
export async function requireCrmProfile(
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
export async function resolveActor(
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
