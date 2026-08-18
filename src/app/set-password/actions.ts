"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setPassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    redirect(
      `/set-password?message=${encodeURIComponent(
        "Password must be at least 6 characters"
      )}`
    );
  }
  if (password !== confirmPassword) {
    redirect(
      `/set-password?message=${encodeURIComponent("Passwords do not match")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/set-password?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
