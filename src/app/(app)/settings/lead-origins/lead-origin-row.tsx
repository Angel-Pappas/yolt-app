"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteLeadOrigin, updateLeadOrigin } from "./actions";
import { LeadOriginFormDialog } from "./lead-origin-form-dialog";
import type { LeadOrigin } from "./queries";

export function LeadOriginRow({ origin }: { origin: LeadOrigin }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass({ interactive: true })}>
      <td className="px-4 py-3 text-sm text-ink">{origin.name}</td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteLeadOrigin(origin.id)}
          confirmMessage="Delete this origin?"
          label="Delete origin"
        />

        <LeadOriginFormDialog
          dialogRef={dialogRef}
          title="Edit origin"
          submitLabel="Save"
          defaultValues={{ name: origin.name }}
          action={updateLeadOrigin.bind(null, origin.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
