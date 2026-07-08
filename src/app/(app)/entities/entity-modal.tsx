"use client";

import { useRef } from "react";
import { PlusIcon } from "@/components/icons";
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
          triggerClassName ??
          "inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px"
        }
      >
        <PlusIcon className="h-3.5 w-3.5" />
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
