import { redirect } from "next/navigation";

// Account moved into Settings (2026-08). Redirect kept for old links.
export default function AccountRedirect() {
  redirect("/settings/account");
}
