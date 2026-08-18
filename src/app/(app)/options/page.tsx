import { redirect } from "next/navigation";

// Options became Settings → Appearance (2026-08). Redirect kept for old links.
export default function OptionsRedirect() {
  redirect("/settings/appearance");
}
