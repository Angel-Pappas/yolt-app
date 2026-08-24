import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Tabs } from "@/components/tabs";
import { requireCrm } from "../../require-access";
import {
  getLead,
  getLeadActions,
  getLeadContacts,
  getUsersForPicker,
} from "../queries";
import { getActiveLeadOrigins } from "../../settings/lead-origins/queries";
import { getActiveLeadStatuses } from "../../settings/lead-statuses/queries";
import { getProjectForLead } from "../../projects/queries";
import { LeadEditForm } from "./lead-edit-form";
import { ActionsPanel } from "./actions-panel";
import { ContactsPanel } from "./contacts-panel";
import { ConvertToProject } from "./convert-to-project";

export default async function LeadEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireCrm();
  const { id } = await params;
  const supabase = await createClient();

  const lead = await getLead(supabase, id);
  if (!lead) notFound();

  const [
    { data: origins },
    { data: statuses },
    actions,
    contacts,
    users,
    existingProject,
  ] = await Promise.all([
    getActiveLeadOrigins(supabase),
    getActiveLeadStatuses(supabase),
    getLeadActions(supabase, id),
    getLeadContacts(supabase, id),
    profile.isAdmin
      ? getUsersForPicker(supabase)
      : Promise.resolve([
          { id: profile.id, name: profile.name || profile.email || "Me" },
        ]),
    getProjectForLead(supabase, id),
  ]);

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">{lead.name}</h1>
        <ConvertToProject
          leadId={id}
          leadName={lead.name}
          existingProject={existingProject}
        />
      </div>

      <LeadEditForm
        lead={lead}
        origins={origins ?? []}
        statuses={statuses ?? []}
      />

      <Tabs
        defaultTab="history"
        tabs={[
          {
            id: "history",
            label: "History",
            content: (
              <ActionsPanel
                leadId={id}
                actions={actions}
                users={users}
                isAdmin={profile.isAdmin}
                currentUserId={profile.id}
              />
            ),
          },
          {
            id: "contacts",
            label: "Contacts",
            content: <ContactsPanel leadId={id} contacts={contacts} />,
          },
        ]}
      />
    </div>
  );
}
