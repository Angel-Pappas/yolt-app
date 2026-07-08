"use client";

import { useRef } from "react";
import { PlusIcon } from "@/components/icons";
import { WalletFormDialog } from "./wallet-form-dialog";

type WalletModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
  };
  action: (formData: FormData) => Promise<void>;
};

export function WalletModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  defaultValues,
  action,
}: WalletModalProps) {
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
          "inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px"
        }
      >
        <PlusIcon className="h-3.5 w-3.5" />
        {trigger}
      </button>

      <WalletFormDialog
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
