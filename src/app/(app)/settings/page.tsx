import { redirect } from "next/navigation";

/**
 * /settings has no page of its own — it lands on Account, the one section every
 * user can always access.
 */
export default function SettingsIndexPage() {
  redirect("/settings/account");
}
