import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { AddActionModal } from "./add-action-modal";
import { ActionRow } from "./action-row";
import type {
  ActionRecord,
  UserOption,
  AddActionFn,
  UpdateActionFn,
  DeleteActionFn,
} from "./types";

/**
 * The History sub-tab: a table of actions (newest first) plus Add, shared by the
 * Leads and Projects features. This is a server component — the interactive bits
 * (rows, add modal) are client children — so the feature's Server Actions are
 * passed straight through as props (add/update/delete), the supported way to
 * hand a Server Action to a client child.
 */
export function ActionsPanel({
  parentId,
  actions,
  users,
  isAdmin,
  currentUserId,
  placeholder,
  addAction,
  updateAction,
  deleteAction,
}: {
  parentId: string;
  actions: ActionRecord[];
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
  placeholder?: string;
  addAction: AddActionFn;
  updateAction: UpdateActionFn;
  deleteAction: DeleteActionFn;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddActionModal
          parentId={parentId}
          users={users}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          placeholder={placeholder}
          addAction={addAction}
        />
      </div>

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Date</th>
                <th className={thClass}>User</th>
                <th className={thClass}>Action</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  parentId={parentId}
                  users={users}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  placeholder={placeholder}
                  updateAction={updateAction}
                  deleteAction={deleteAction}
                />
              ))}
              {actions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-ink-faint"
                  >
                    No actions logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
