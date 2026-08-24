"use client";

import { useState } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { ModalShell } from "@/components/dialog/modal-shell";
import { LeadFields } from "./lead-fields";
import { addLead } from "./actions";
import { LeadOriginFormDialog } from "../settings/lead-origins/lead-origin-form-dialog";
import { addLeadOrigin } from "../settings/lead-origins/actions";
import type { LeadOrigin } from "../settings/lead-origins/queries";
import type { LeadStatus } from "../settings/lead-statuses/queries";

/**
 * "Add lead" — the complete lead form (everything but the sub-tabs) in a modal
 * on the list. Saving creates the lead and closes the modal (revalidating the
 * list underneath), so you land back on the list. The origin picker's "+ Add"
 * dialog is a sibling of the form (dialogChildren), same rule as the
 * transaction form's nested entity dialog.
 */
export function LeadAddModal({
  origins,
  statuses,
}: {
  origins: LeadOrigin[];
  statuses: LeadStatus[];
}) {
  const modal = useDialog();
  const originDialog = useDialog();
  // Bumped on each open so the uncontrolled fields reset to blank for a fresh add.
  const [generation, setGeneration] = useState(0);

  function handleOpen() {
    setGeneration((g) => g + 1);
    modal.open();
  }

  async function handleAdd(formData: FormData) {
    // Returned (not thrown) so ModalShell can show a real error message.
    return addLead(formData);
  }

  return (
    <>
      <AddButton trigger="Add lead" onClick={handleOpen} />

      <ModalShell
        dialogRef={modal.dialogRef}
        title="Add lead"
        submitLabel="Save"
        action={handleAdd}
        onDone={modal.close}
        maxWidth="max-w-2xl"
        dialogChildren={
          <LeadOriginFormDialog
            dialogRef={originDialog.dialogRef}
            title="Add origin"
            submitLabel="Add"
            action={addLeadOrigin}
            onDone={originDialog.close}
          />
        }
      >
        <LeadFields
          key={generation}
          origins={origins}
          statuses={statuses}
          onAddOrigin={originDialog.open}
        />
      </ModalShell>
    </>
  );
}
