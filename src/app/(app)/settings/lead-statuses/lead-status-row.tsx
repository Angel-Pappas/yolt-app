"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteLeadStatus, updateLeadStatus } from "./actions";
import { LeadStatusFormDialog } from "./lead-status-form-dialog";
import type { LeadStatus } from "./queries";

export function LeadStatusRow({ status }: { status: LeadStatus }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3 text-sm text-ink">{status.name}</td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteLeadStatus(status.id)}
          confirmMessage="Delete this status?"
          label="Delete status"
        />

        <LeadStatusFormDialog
          dialogRef={dialogRef}
          title="Edit status"
          submitLabel="Save"
          defaultValues={{ name: status.name }}
          action={updateLeadStatus.bind(null, status.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
