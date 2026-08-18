import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/user";
import { AREAS } from "./areas";

const AREA_BLURB: Record<string, string> = {
  finance: "Transactions, wallets, entities and taxes — the company's books.",
  business: "Leads and client relationships — the CRM.",
};

/**
 * The launcher / home. Always shows the areas the signed-in user can access and
 * lets them enter one — it never auto-enters, even for a single-area user
 * (explicit product direction). Area-neutral, so the main side nav hides here.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const profile = await getProfile(supabase);

  const accessible = AREAS.filter((area) =>
    area.access === "finance"
      ? profile?.canAccessFinance
      : profile?.canAccessCrm
  );

  const greetingName = profile?.name || profile?.email?.split("@")[0];

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">
          {greetingName ? `Welcome, ${greetingName}` : "Welcome"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Choose an area to work in.
        </p>
      </div>

      {accessible.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm text-ink-muted">
            You don&apos;t have access to any areas yet. Ask an administrator to
            grant you access.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accessible.map((area) => (
            <Link
              key={area.id}
              href={area.home}
              className="group flex flex-col gap-2 rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-card)] transition-colors hover:border-edge-strong hover:bg-canvas"
            >
              <span className="font-display text-xl font-semibold text-ink">
                {area.label}
              </span>
              <span className="text-sm text-ink-muted">
                {AREA_BLURB[area.id]}
              </span>
              <span className="mt-2 text-sm font-semibold text-accent">
                Enter {area.label} →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
