import { requireCrm } from "../require-access";

/**
 * Placeholder for the Business area's Leads (CRM), built in the next phase.
 * Exists now so the area switcher and side nav have a working destination.
 */
export default async function LeadsPage() {
  await requireCrm();

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-3xl font-bold text-ink">Leads</h1>
      <div className="rounded-xl border border-edge bg-surface p-6 shadow-[var(--shadow-card)]">
        <p className="text-sm text-ink-muted">The CRM is coming soon.</p>
      </div>
    </div>
  );
}
