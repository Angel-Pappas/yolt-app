"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { formatDate } from "@/lib/format";
import { ActionFormDialog } from "./action-form-dialog";
import type {
  ActionRecord,
  UserOption,
  UpdateActionFn,
  DeleteActionFn,
} from "./types";

export function ActionRow({
  action,
  parentId,
  users,
  isAdmin,
  currentUserId,
  placeholder,
  updateAction,
  deleteAction,
}: {
  action: ActionRecord;
  parentId: string;
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
  placeholder?: string;
  updateAction: UpdateActionFn;
  deleteAction: DeleteActionFn;
}) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass({ interactive: true })}>
      <td className="px-4 py-3 align-top text-sm whitespace-nowrap text-ink-muted tabular-nums">
        {formatDate(action.action_date)}
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
          action={() => deleteAction(action.id, parentId)}
          confirmMessage="Delete this action?"
          label="Delete action"
        />

        <ActionFormDialog
          dialogRef={dialogRef}
          title="Edit action"
          submitLabel="Save"
          defaultValues={{
            body: action.body,
            action_date: action.action_date,
            user_id: action.user_id,
          }}
          users={users}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          placeholder={placeholder}
          action={updateAction.bind(null, action.id, parentId)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
