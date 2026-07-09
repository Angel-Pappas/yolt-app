"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Plain manual checks rather than parseOrThrow/zod, matching its two
 * siblings below — this page's forms are plain `<form action={...}>`
 * posts with no client-side try/catch, so a thrown validation error would
 * hit Next.js's generic error boundary instead of the inline `?message=`
 * banner these three already share. See entities/actions.ts etc. for the
 * zod pattern used everywhere a modal dialog catches the error itself.
 */
export async function updateDisplayName(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string | null)?.trim() ?? "";

  if (!name) {
    redirect(`/account?message=${encodeURIComponent("Name is required")}`);
  }
  if (name.length > 80) {
    redirect(`/account?message=${encodeURIComponent("Name is too long")}`);
  }

  const { error } = await supabase.auth.updateUser({ data: { full_name: name } });

  if (error) {
    redirect(`/account?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/account?message=" + encodeURIComponent("Name updated"));
}

export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/auth/confirm` }
  );

  if (error) {
    redirect(`/account?message=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/account?message=" +
      encodeURIComponent("Check your new email address to confirm the change")
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    redirect(
      `/account?message=${encodeURIComponent("Passwords do not match")}`
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/account?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/account?message=" + encodeURIComponent("Password updated"));
}
