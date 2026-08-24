"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteProjectStatus, updateProjectStatus } from "./actions";
import { ProjectStatusFormDialog } from "./project-status-form-dialog";
import type { ProjectStatus } from "./queries";

export function ProjectStatusRow({ status }: { status: ProjectStatus }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3 text-sm text-ink">{status.name}</td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteProjectStatus(status.id)}
          confirmMessage="Delete this status?"
          label="Delete status"
        />

        <ProjectStatusFormDialog
          dialogRef={dialogRef}
          title="Edit status"
          submitLabel="Save"
          defaultValues={{ name: status.name }}
          action={updateProjectStatus.bind(null, status.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
