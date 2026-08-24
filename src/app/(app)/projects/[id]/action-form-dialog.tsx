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
import type { UserOption } from "../../leads/queries";

type ActionFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: { body: string; action_date: string; user_id: string };
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
  /** Bumped by the Add wrapper on every open so a fresh form resets to blank/today. */
  resetKey?: number;
  action: (formData: FormData) => Promise<void | { error?: string | null }>;
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
  const [date, setDate] = useState(
    defaultValues?.action_date ?? todayLocalIsoDate()
  );

  // Reset to today (or the edited action's date) each time resetKey changes.
  // Adjusted during render, not in an effect (set-state-in-effect rule).
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
          placeholder="e.g. Sent the offer, waiting on their feedback"
          className={formInputClass}
        />
      </div>
    </ModalShell>
  );
}
