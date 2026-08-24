import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { AddActionModal } from "./add-action-modal";
import { ActionRow } from "./action-row";
import type { ProjectAction } from "../queries";
import type { UserOption } from "../../leads/queries";

/**
 * The History sub-tab: a table of project actions (newest first), plus Add.
 * Server component — the interactive bits (rows, add modal) are client children.
 */
export function ActionsPanel({
  projectId,
  actions,
  users,
  isAdmin,
  currentUserId,
}: {
  projectId: string;
  actions: ProjectAction[];
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddActionModal
          projectId={projectId}
          users={users}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
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
                  projectId={projectId}
                  users={users}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
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
