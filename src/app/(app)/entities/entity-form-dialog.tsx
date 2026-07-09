"use client";

import { useId } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";

type EntityFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
    vat_number: string | null;
  };
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function EntityFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: EntityFormDialogProps) {
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
        <label htmlFor={`${uid}-vat_number`} className={formLabelClass}>
          VAT number
        </label>
        <input
          id={`${uid}-vat_number`}
          name="vat_number"
          type="text"
          defaultValue={defaultValues?.vat_number ?? ""}
          className={formInputClass}
        />
      </div>
    </ModalShell>
  );
}
