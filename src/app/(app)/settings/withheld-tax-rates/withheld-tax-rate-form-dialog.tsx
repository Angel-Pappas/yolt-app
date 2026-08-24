"use client";

import { useId } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";

type WithheldTaxRateFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
    rate: string;
  };
  action: (formData: FormData) => Promise<void | { error?: string | null }>;
  onDone: () => void;
};

export function WithheldTaxRateFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: WithheldTaxRateFormDialogProps) {
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
        <label htmlFor={`${uid}-rate`} className={formLabelClass}>
          Rate (%)
        </label>
        <input
          id={`${uid}-rate`}
          name="rate"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={defaultValues?.rate}
          className={formInputClass}
        />
      </div>
    </ModalShell>
  );
}
