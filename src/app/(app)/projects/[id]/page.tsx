import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCrm } from "../../require-access";
import { getProject, getProjectActions } from "../queries";
import { getActiveProjectStatuses } from "../../settings/project-statuses/queries";
import { getUsersForPicker } from "../../leads/queries";
import { ProjectEditForm } from "./project-edit-form";
import { ActionsPanel } from "./actions-panel";

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireCrm();
  const { id } = await params;
  const supabase = await createClient();

  const project = await getProject(supabase, id);
  if (!project) notFound();

  const [{ data: statuses }, actions, users] = await Promise.all([
    getActiveProjectStatuses(supabase),
    getProjectActions(supabase, id),
    profile.isAdmin
      ? getUsersForPicker(supabase)
      : Promise.resolve([
          { id: profile.id, name: profile.name || profile.email || "Me" },
        ]),
  ]);

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-ink">
            {project.name}
          </h1>
          {project.lead_id && (
            <Link
              href={`/leads/${project.lead_id}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              View lead →
            </Link>
          )}
        </div>
        {project.contact_name && (
          <p className="text-sm text-ink-muted">
            Main contact:{" "}
            <span className="font-medium text-ink">{project.contact_name}</span>
          </p>
        )}
      </div>

      <ProjectEditForm project={project} statuses={statuses ?? []} />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold text-ink">History</h2>
        <ActionsPanel
          projectId={id}
          actions={actions}
          users={users}
          isAdmin={profile.isAdmin}
          currentUserId={profile.id}
        />
      </section>
    </div>
  );
}
