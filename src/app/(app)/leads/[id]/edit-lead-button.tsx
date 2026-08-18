"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { LeadFormDialog, type LeadDefaultValues } from "../lead-form-dialog";
import { updateLead } from "../actions";
import type { LeadStatus } from "../../settings/lead-statuses/queries";

export function EditLeadButton({
  leadId,
  statuses,
  defaultValues,
}: {
  leadId: string;
  statuses: LeadStatus[];
  defaultValues: LeadDefaultValues;
}) {
  const { dialogRef, open, close } = useDialog();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
      >
        Edit
      </button>

      <LeadFormDialog
        dialogRef={dialogRef}
        title="Edit lead"
        submitLabel="Save"
        statuses={statuses}
        defaultValues={defaultValues}
        action={updateLead.bind(null, leadId)}
        onDone={close}
      />
    </>
  );
}
