"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
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
  const { dialogRef, open, close } = useDialog();

  return (
    <>
      <AddButton
        trigger={trigger}
        triggerClassName={triggerClassName}
        triggerLabel={triggerLabel}
        onClick={open}
      />

      <WalletFormDialog
        dialogRef={dialogRef}
        title={title}
        submitLabel={submitLabel}
        defaultValues={defaultValues}
        action={action}
        onDone={close}
      />
    </>
  );
}
