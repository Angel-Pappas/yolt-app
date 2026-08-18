"use client";

import { useId } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import type { UserOption } from "../queries";

type ActionFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: { body: string; user_id: string };
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
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
  action,
  onDone,
}: ActionFormDialogProps) {
  const uid = useId();

  return (
    <ModalShell
      dialogRef={dialogRef}
      title={title}
      submitLabel={submitLabel}
      action={action}
      onDone={onDone}
      maxWidth="max-w-md"
    >
      {/* Only admins can attribute an action to another user; everyone else's
          actions are always their own (no picker, resolved server-side). */}
      {isAdmin && (
        <div>
          <label htmlFor={`${uid}-user`} className={formLabelClass}>
            User
          </label>
          <select
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
