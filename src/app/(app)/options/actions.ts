"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/auth/confirm` }
  );

  if (error) {
    redirect(`/options?message=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/options?message=" +
      encodeURIComponent("Check your new email address to confirm the change")
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    redirect(
      `/options?message=${encodeURIComponent("Passwords do not match")}`
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/options?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/options?message=" + encodeURIComponent("Password updated"));
}
