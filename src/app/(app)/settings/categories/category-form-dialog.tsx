"use client";

import { useId, useState } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import type { CategoryType } from "./queries";

const TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

type CategoryFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
    type: CategoryType;
  };
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function CategoryFormDialog({
  dialogRef,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: CategoryFormDialogProps) {
  const uid = useId();
  const [type, setType] = useState<CategoryType>(defaultValues?.type ?? "expense");

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
        <label className={formLabelClass}>Type</label>
        <div
          role="radiogroup"
          aria-label="Type"
          className="inline-flex w-full gap-1 rounded-lg border border-edge bg-canvas p-1"
        >
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={type === opt.value}
              onClick={() => setType(opt.value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                type === opt.value
                  ? "bg-surface-raised text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>
    </ModalShell>
  );
}
