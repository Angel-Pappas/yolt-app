"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { WithheldTaxRateFormDialog } from "./withheld-tax-rate-form-dialog";
import { AddButton } from "@/components/table/add-button";

type WithheldTaxRateModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  defaultValues?: {
    name: string;
    rate: string;
  };
  action: (formData: FormData) => Promise<void | { error?: string | null }>;
};

export function WithheldTaxRateModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  defaultValues,
  action,
}: WithheldTaxRateModalProps) {
  const { dialogRef, open, close } = useDialog();

  return (
    <>
      <AddButton
        trigger={trigger}
        triggerClassName={triggerClassName}
        triggerLabel={triggerLabel}
        onClick={open}
      />

      <WithheldTaxRateFormDialog
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
