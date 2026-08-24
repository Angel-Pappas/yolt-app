"use client";

import { useId } from "react";
import Link from "next/link";
import { useDialog } from "@/components/dialog/use-dialog";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import { convertLeadToProject } from "../../projects/actions";

/**
 * On a lead: either a "Convert to project" button (opens a one-field name
 * prompt) or, once converted, a "View project" link. Converting creates the
 * project, marks the lead "Project agreed" (which hides it from the active
 * leads list), and redirects to the new project.
 */
export function ConvertToProject({
  leadId,
  leadName,
  existingProject,
}: {
  leadId: string;
  leadName: string;
  existingProject: { id: string; name: string } | null;
}) {
  const modal = useDialog();
  const uid = useId();

  if (existingProject) {
    return (
      <Link
        href={`/projects/${existingProject.id}`}
        className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-semibold text-accent transition hover:bg-canvas"
      >
        View project →
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={modal.open}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px"
      >
        Convert to project
      </button>

      <ModalShell
        dialogRef={modal.dialogRef}
        title="Convert to project"
        submitLabel="Create project"
        action={convertLeadToProject.bind(null, leadId)}
        onDone={modal.close}
      >
        <p className="text-sm text-ink-muted">
          This creates a project from the lead and marks the lead as{" "}
          <span className="font-medium text-ink">Project agreed</span>.
        </p>
        <div>
          <label htmlFor={`${uid}-name`} className={formLabelClass}>
            Project name
          </label>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            autoFocus
            defaultValue={leadName}
            className={formInputClass}
          />
        </div>
      </ModalShell>
    </>
  );
}
