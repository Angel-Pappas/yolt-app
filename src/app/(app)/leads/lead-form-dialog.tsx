"use client";

import { useId } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import type { LeadStatus } from "../settings/lead-statuses/queries";

export type LeadDefaultValues = {
  name: string;
  phone: string | null;
  email: string | null;
  needs: string | null;
  description: string | null;
  status_id: string | null;
};

type LeadFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  statuses: LeadStatus[];
  defaultValues?: LeadDefaultValues;
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function LeadFormDialog({
  dialogRef,
  title,
  submitLabel,
  statuses,
  defaultValues,
  action,
  onDone,
}: LeadFormDialogProps) {
  const uid = useId();

  return (
    <ModalShell
      dialogRef={dialogRef}
      title={title}
      submitLabel={submitLabel}
      action={action}
      onDone={onDone}
      maxWidth="max-w-lg"
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
          <label htmlFor={`${uid}-status`} className={formLabelClass}>
            Status
          </label>
          <select
            id={`${uid}-status`}
            name="status_id"
            defaultValue={defaultValues?.status_id ?? ""}
            className={formInputClass}
          >
            <option value="">— None —</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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

        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-needs`} className={formLabelClass}>
            Their needs
          </label>
          <textarea
            id={`${uid}-needs`}
            name="needs"
            rows={3}
            defaultValue={defaultValues?.needs ?? ""}
            className={formInputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-description`} className={formLabelClass}>
            Project description
          </label>
          <textarea
            id={`${uid}-description`}
            name="description"
            rows={3}
            defaultValue={defaultValues?.description ?? ""}
            className={formInputClass}
          />
        </div>
      </div>
    </ModalShell>
  );
}
