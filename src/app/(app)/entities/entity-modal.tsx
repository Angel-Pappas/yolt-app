"use client";

import { useRef } from "react";
import { EntityFormDialog } from "./entity-form-dialog";

type EntityModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
    vat_number: string | null;
  };
  action: (formData: FormData) => Promise<void>;
  onDone?: () => void;
};

export function EntityModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: EntityModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
    onDone?.();
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label={triggerLabel}
        className={
          triggerClassName ?? "rounded bg-black px-3 py-1.5 text-sm text-white"
        }
      >
        {trigger}
      </button>

      <EntityFormDialog
        dialogRef={dialogRef}
        title={title}
        submitLabel={submitLabel}
        defaultValues={defaultValues}
        action={action}
        onDone={closeModal}
      />
    </>
  );
}
