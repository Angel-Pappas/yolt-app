import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/user";
import { TopBar } from "./top-bar";
import { SideNav } from "./side-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const profile = await getProfile(supabase);

  // No profile row, or a deactivated account → back to login. The DB RLS is the
  // real lock; this keeps a shell from rendering for someone who can't use it.
  if (!profile || !profile.isActive) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-canvas">
      <TopBar
        name={profile.name}
        email={profile.email}
        canAccessFinance={profile.canAccessFinance}
        canAccessCrm={profile.canAccessCrm}
      />
      <div className="flex flex-1">
        <SideNav
          canAccessFinance={profile.canAccessFinance}
          canAccessCrm={profile.canAccessCrm}
        />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
