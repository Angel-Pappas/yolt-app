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
    starting_balance: string;
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

      <div>
        <label htmlFor={`${uid}-starting-balance`} className={formLabelClass}>
          Starting balance
        </label>
        <input
          id={`${uid}-starting-balance`}
          name="starting_balance"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.starting_balance ?? 0}
          className={formInputClass}
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          The balance this wallet already held before any transactions here. Set once, but
          editable if it needs correcting.
        </p>
      </div>
    </ModalShell>
  );
}
