import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/user";
import { SettingsNav } from "./settings-nav";

/**
 * The global Settings area shell — a master-detail layout with a role-gated
 * sub-nav on the left and the selected section on the right. Area-neutral: the
 * app's main side nav hides on /settings/* (see side-nav.tsx / areaForPath), so
 * this provides its own navigation, same as the Lists section used to.
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const profile = await getProfile(supabase);
  if (!profile || !profile.isActive) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1">
      <SettingsNav
        canAccessFinance={profile.canAccessFinance}
        canAccessCrm={profile.canAccessCrm}
        isAdmin={profile.isAdmin}
      />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
