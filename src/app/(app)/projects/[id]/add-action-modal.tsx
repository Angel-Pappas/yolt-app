"use client";

import { useState } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { ActionFormDialog } from "./action-form-dialog";
import { addProjectAction } from "../actions";
import type { UserOption } from "../../leads/queries";

export function AddActionModal({
  projectId,
  users,
  isAdmin,
  currentUserId,
}: {
  projectId: string;
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const { dialogRef, open, close } = useDialog();
  // Bumped on each open so the reused dialog resets to a blank form dated today.
  const [resetKey, setResetKey] = useState(0);

  function handleOpen() {
    setResetKey((k) => k + 1);
    open();
  }

  return (
    <>
      <AddButton trigger="Add action" onClick={handleOpen} />
      <ActionFormDialog
        dialogRef={dialogRef}
        title="Add action"
        submitLabel="Add"
        users={users}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        resetKey={resetKey}
        action={addProjectAction.bind(null, projectId)}
        onDone={close}
      />
    </>
  );
}
