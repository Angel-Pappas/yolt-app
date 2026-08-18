"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { formatDate } from "@/lib/format";
import { ActionFormDialog } from "../action-form-dialog";
import { updateLeadAction, deleteLeadAction } from "../actions";
import type { LeadAction, UserOption } from "../queries";

export function ActionRow({
  action,
  leadId,
  users,
  isAdmin,
  currentUserId,
}: {
  action: LeadAction;
  leadId: string;
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass({ interactive: true })}>
      <td className="px-4 py-3 align-top text-sm whitespace-nowrap text-ink-muted tabular-nums">
        {formatDate(action.created_at.slice(0, 10))}
      </td>
      <td className="px-4 py-3 align-top text-sm whitespace-nowrap text-ink-muted">
        {action.author_name ?? "—"}
      </td>
      <td className="px-4 py-3 align-top text-sm whitespace-pre-wrap text-ink">
        {action.body}
      </td>
      <td
        className="px-4 py-3 text-right align-top"
        onClick={(e) => e.stopPropagation()}
      >
        <DeleteButton
          action={() => deleteLeadAction(action.id, leadId)}
          confirmMessage="Delete this action?"
          label="Delete action"
        />

        <ActionFormDialog
          dialogRef={dialogRef}
          title="Edit action"
          submitLabel="Save"
          defaultValues={{ body: action.body, user_id: action.user_id }}
          users={users}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          action={updateLeadAction.bind(null, action.id, leadId)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
