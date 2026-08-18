"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { ActionFormDialog } from "../action-form-dialog";
import { addLeadAction } from "../actions";
import type { UserOption } from "../queries";

export function AddActionModal({
  leadId,
  users,
  isAdmin,
  currentUserId,
}: {
  leadId: string;
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const { dialogRef, open, close } = useDialog();

  return (
    <>
      <AddButton trigger="Add action" onClick={open} />
      <ActionFormDialog
        dialogRef={dialogRef}
        title="Add action"
        submitLabel="Add"
        users={users}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        action={addLeadAction.bind(null, leadId)}
        onDone={close}
      />
    </>
  );
}
