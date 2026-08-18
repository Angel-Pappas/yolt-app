import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { requireCrm } from "../../require-access";
import { getLead, getLeadActivities } from "../queries";
import { getActiveLeadStatuses } from "../../settings/lead-statuses/queries";
import { EditLeadButton } from "./edit-lead-button";
import { ActivityForm } from "./activity-form";
import { ActivityEntry } from "./activity-entry";

const cardClass =
  "rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)]";
const labelClass =
  "text-xs font-semibold tracking-wider text-ink-faint uppercase";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

function FieldBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="sm:col-span-2">
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-0.5 text-sm whitespace-pre-wrap text-ink">
        {value || "—"}
      </dd>
    </div>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCrm();
  const { id } = await params;
  const supabase = await createClient();

  const lead = await getLead(supabase, id);
  if (!lead) notFound();

  const [{ data: statuses }, activities] = await Promise.all([
    getActiveLeadStatuses(supabase),
    getLeadActivities(supabase, id),
  ]);
  const statusList = statuses ?? [];

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div>
        <Link href="/leads" className="text-sm text-ink-muted hover:text-ink">
          ← Leads
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold text-ink">
            {lead.name}
          </h1>
          {lead.status_name && (
            <span className="inline-flex w-fit rounded-full border border-edge bg-canvas px-2 py-0.5 text-xs font-medium text-ink-muted">
              {lead.status_name}
            </span>
          )}
        </div>
        <EditLeadButton
          leadId={lead.id}
          statuses={statusList}
          defaultValues={{
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            needs: lead.needs,
            description: lead.description,
            status_id: lead.status_id,
          }}
        />
      </div>

      <section className={cardClass}>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" value={lead.phone} />
          <Field label="Email" value={lead.email} />
          <Field label="Added" value={formatDate(lead.created_at.slice(0, 10))} />
          <FieldBlock label="Their needs" value={lead.needs} />
          <FieldBlock label="Project description" value={lead.description} />
        </dl>
      </section>

      <section className={`${cardClass} space-y-4`}>
        <h2 className="font-display text-lg font-semibold text-ink">Activity</h2>
        <ActivityForm leadId={lead.id} />
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-sm text-ink-faint">No activity logged yet.</p>
          ) : (
            activities.map((activity) => (
              <ActivityEntry
                key={activity.id}
                activity={activity}
                leadId={lead.id}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
