"use client";

import { useId } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";

type WalletFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
  };
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function WalletFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: WalletFormDialogProps) {
  const uid = useId();

  return (
    <ModalShell
      dialogRef={dialogRef}
      title={title}
      submitLabel={submitLabel}
      action={action}
      onDone={onDone}
    >
      <div>
        <label htmlFor={`${uid}-name`} className={formLabelClass}>
          Name
        </label>
        <input
          id={`${uid}-name`}
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          className={formInputClass}
        />
      </div>
    </ModalShell>
  );
}
