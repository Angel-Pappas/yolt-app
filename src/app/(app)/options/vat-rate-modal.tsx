"use client";

import { useRef } from "react";
import { VatRateFormDialog } from "./vat-rate-form-dialog";
import { PlusIcon } from "@/components/icons";

type VatRateModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
    rate: string;
  };
  action: (formData: FormData) => Promise<void>;
};

export function VatRateModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  defaultValues,
  action,
}: VatRateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label={triggerLabel}
        className={
          triggerClassName ??
          "inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px"
        }
      >
        <PlusIcon className="h-3.5 w-3.5" />
        {trigger}
      </button>

      <VatRateFormDialog
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
