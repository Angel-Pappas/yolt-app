"use client";

import { useId } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { ModalShell } from "@/components/dialog/modal-shell";
import { AddButton } from "@/components/table/add-button";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import { inviteUser } from "./actions";

const checkboxClass = "h-4 w-4 rounded border-edge accent-[var(--accent)]";
const checkLabelClass = "flex items-center gap-2 text-sm text-ink";

export function InviteUserModal() {
  const { dialogRef, open, close } = useDialog();
  const uid = useId();

  return (
    <>
      <AddButton trigger="Invite user" onClick={open} />

      <ModalShell
        dialogRef={dialogRef}
        title="Invite user"
        submitLabel="Send invite"
        action={inviteUser}
        onDone={close}
        maxWidth="max-w-sm"
      >
        <div>
          <label htmlFor={`${uid}-email`} className={formLabelClass}>
            Email
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            required
            autoFocus
            className={formInputClass}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className={formLabelClass}>Access</legend>
          <label className={checkLabelClass}>
            <input
              type="checkbox"
              name="can_access_finance"
              className={checkboxClass}
            />
            Finance
          </label>
          <label className={checkLabelClass}>
            <input
              type="checkbox"
              name="can_access_crm"
              className={checkboxClass}
            />
            Business (CRM)
          </label>
        </fieldset>

        <p className="text-xs text-ink-faint">
          They&apos;ll get an email link to set a password and sign in.
        </p>
      </ModalShell>
    </>
  );
}
