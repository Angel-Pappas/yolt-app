"use client";

import { useId } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";

export type ContactDefaultValues = {
  name: string;
  phone: string | null;
  landline: string | null;
  website: string | null;
  email: string | null;
};

type ContactFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: ContactDefaultValues;
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function ContactFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: ContactFormDialogProps) {
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className={formLabelClass}>
            Name
          </label>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            autoFocus
            defaultValue={defaultValues?.name}
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={formLabelClass}>
            Email
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="text"
            defaultValue={defaultValues?.email ?? ""}
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={formLabelClass}>
            Phone
          </label>
          <input
            id={`${uid}-phone`}
            name="phone"
            type="text"
            defaultValue={defaultValues?.phone ?? ""}
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-landline`} className={formLabelClass}>
            Landline
          </label>
          <input
            id={`${uid}-landline`}
            name="landline"
            type="text"
            defaultValue={defaultValues?.landline ?? ""}
            className={formInputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-website`} className={formLabelClass}>
            Website
          </label>
          <input
            id={`${uid}-website`}
            name="website"
            type="text"
            defaultValue={defaultValues?.website ?? ""}
            className={formInputClass}
          />
        </div>
      </div>
    </ModalShell>
  );
}
