"use client";

import { useRef } from "react";
import { TransactionFormDialog } from "./transaction-form-dialog";

type TransactionModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  defaultValues?: {
    date: string;
    amount: string;
    description: string;
  };
  action: (formData: FormData) => Promise<void>;
};

export function TransactionModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  defaultValues,
  action,
}: TransactionModalProps) {
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
          triggerClassName ?? "rounded bg-black px-3 py-1.5 text-sm text-white"
        }
      >
        {trigger}
      </button>

      <TransactionFormDialog
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
