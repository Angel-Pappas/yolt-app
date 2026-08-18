"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { VatRateFormDialog } from "./vat-rate-form-dialog";
import { AddButton } from "@/components/table/add-button";

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
  const { dialogRef, open, close } = useDialog();

  return (
    <>
      <AddButton
        trigger={trigger}
        triggerClassName={triggerClassName}
        triggerLabel={triggerLabel}
        onClick={open}
      />

      <VatRateFormDialog
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
