"use client";

import { useId, useState } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { DateField } from "@/components/date-field";
import {
  formFieldBoxClass,
  formInputClass,
  formLabelClass,
} from "@/components/form-styles";
import { todayLocalIsoDate } from "@/lib/format";
import type { UserOption } from "./queries";

type ActionFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: { body: string; action_date: string; user_id: string };
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
  /**
   * Bumped by the Add wrappers on every open so a fresh "Add action" resets to
   * a blank form dated today — the dialog instance is reused across opens, so
   * without this the previous entry's text/date would linger. Left at its
   * default for the edit dialog, which should keep the action's own values.
   */
  resetKey?: number;
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function ActionFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  users,
  isAdmin,
  currentUserId,
  resetKey = 0,
  action,
  onDone,
}: ActionFormDialogProps) {
  const uid = useId();
  // Defaults to today for a new action; editable, and pre-filled on edit.
  const [date, setDate] = useState(
    defaultValues?.action_date ?? todayLocalIsoDate()
  );

  // Reset the date to today (or the edited action's date) each time the Add
  // wrapper bumps resetKey. Adjusted during render, not in an effect, per the
  // codebase's set-state-in-effect rule. The uncontrolled fields below reset
  // via key={resetKey}.
  const [lastReset, setLastReset] = useState(resetKey);
  if (resetKey !== lastReset) {
    setLastReset(resetKey);
    setDate(defaultValues?.action_date ?? todayLocalIsoDate());
  }

  return (
    <ModalShell
      dialogRef={dialogRef}
      title={title}
      submitLabel={submitLabel}
      action={action}
      onDone={onDone}
      maxWidth="max-w-md"
    >
      <div>
        <label htmlFor={`${uid}-date`} className={formLabelClass}>
          Date
        </label>
        <DateField
          id={`${uid}-date`}
          name="action_date"
          required
          showCalendar={false}
          value={date}
          onChange={setDate}
          className={formFieldBoxClass}
        />
      </div>

      {/* Only admins can attribute an action to another user; everyone else's
          actions are always their own (no picker, resolved server-side). */}
      {isAdmin && (
        <div>
          <label htmlFor={`${uid}-user`} className={formLabelClass}>
            User
          </label>
          <select
            key={resetKey}
            id={`${uid}-user`}
            name="user_id"
            defaultValue={defaultValues?.user_id ?? currentUserId}
            className={formInputClass}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={`${uid}-body`} className={formLabelClass}>
          Action
        </label>
        <textarea
          key={resetKey}
          id={`${uid}-body`}
          name="body"
          rows={3}
          required
          autoFocus
          defaultValue={defaultValues?.body ?? ""}
          placeholder="e.g. Called and they didn't reply — will call again"
          className={formInputClass}
        />
      </div>
    </ModalShell>
  );
}
