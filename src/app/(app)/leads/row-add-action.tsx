"use client";

import { useState } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { PlusIcon } from "@/components/icons";
import { ActionFormDialog } from "./action-form-dialog";
import { addLeadAction } from "./actions";
import type { UserOption } from "./queries";

/**
 * Per-row "add action" — a small icon button that opens the same action modal
 * used on the lead's History tab. The action's date defaults to today but is
 * editable; the user types the text. Admins get the actor picker.
 */
export function RowAddAction({
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
  // Bumped on each open so the reused dialog resets to a blank form dated today.
  const [resetKey, setResetKey] = useState(0);

  function handleOpen() {
    setResetKey((k) => k + 1);
    open();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Add action"
        title="Add action"
        className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
      >
        <PlusIcon className="h-4 w-4" />
      </button>

      <ActionFormDialog
        dialogRef={dialogRef}
        title="Add action"
        submitLabel="Add"
        users={users}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        resetKey={resetKey}
        action={addLeadAction.bind(null, leadId)}
        onDone={close}
      />
    </>
  );
}
