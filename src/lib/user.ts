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
