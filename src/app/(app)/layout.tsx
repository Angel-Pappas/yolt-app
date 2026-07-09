import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user";
import { TopBar } from "./top-bar";
import { SideNav } from "./side-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { name, email } = await getCurrentUser(supabase);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-canvas">
      <TopBar name={name} email={email} />
      <div className="flex flex-1">
        <SideNav />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
