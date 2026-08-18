"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { ModalShell } from "@/components/dialog/modal-shell";
import { tableRowClass } from "@/components/table/table-styles";
import { formLabelClass } from "@/components/form-styles";
import { updateUserAccess } from "./actions";
import type { ManagedUser } from "./queries";

const checkboxClass = "h-4 w-4 rounded border-edge accent-[var(--accent)]";
const checkLabelClass = "flex items-center gap-2 text-sm text-ink";

function AccessBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
      {label}
    </span>
  );
}

export function UserRow({ user }: { user: ManagedUser }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass({ interactive: true })}>
      <td className="px-4 py-3 text-sm text-ink">
        <span className="font-medium">{user.email}</span>
        {user.invitePending && (
          <span className="ml-2 rounded-full border border-edge bg-canvas px-2 py-0.5 text-xs text-ink-faint">
            Invited
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted">{user.name ?? "—"}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {user.canAccessFinance && <AccessBadge label="Finance" />}
          {user.canAccessCrm && <AccessBadge label="Business" />}
          {user.isAdmin && <AccessBadge label="Admin" />}
          {!user.canAccessFinance && !user.canAccessCrm && !user.isAdmin && (
            <span className="text-sm text-ink-faint">No access</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {user.isActive ? (
          <span className="text-ink-muted">Active</span>
        ) : (
          <span className="text-expense">Inactive</span>
        )}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <ModalShell
          dialogRef={dialogRef}
          title="Edit access"
          submitLabel="Save"
          action={updateUserAccess.bind(null, user.id)}
          onDone={close}
          maxWidth="max-w-sm"
        >
          <p className="text-sm text-ink-muted">{user.email}</p>
          <fieldset className="space-y-2">
            <legend className={formLabelClass}>Access</legend>
            <label className={checkLabelClass}>
              <input
                type="checkbox"
                name="can_access_finance"
                defaultChecked={user.canAccessFinance}
                className={checkboxClass}
              />
              Finance
            </label>
            <label className={checkLabelClass}>
              <input
                type="checkbox"
                name="can_access_crm"
                defaultChecked={user.canAccessCrm}
                className={checkboxClass}
              />
              Business (CRM)
            </label>
            <label className={checkLabelClass}>
              <input
                type="checkbox"
                name="is_admin"
                defaultChecked={user.isAdmin}
                className={checkboxClass}
              />
              Administrator
            </label>
          </fieldset>
          <label className={`${checkLabelClass} border-t border-edge pt-3`}>
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={user.isActive}
              className={checkboxClass}
            />
            Active
          </label>
          <p className="text-xs text-ink-faint">
            An inactive user keeps their data but can&apos;t sign in.
          </p>
        </ModalShell>
      </td>
    </tr>
  );
}
