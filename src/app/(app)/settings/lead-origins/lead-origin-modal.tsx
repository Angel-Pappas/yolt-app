"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { LeadOriginFormDialog } from "./lead-origin-form-dialog";

type LeadOriginModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  defaultValues?: { name: string };
  action: (formData: FormData) => Promise<void>;
  onDone?: () => void;
};

export function LeadOriginModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: LeadOriginModalProps) {
  const { dialogRef, open, close } = useDialog();

  function handleDone() {
    close();
    onDone?.();
  }

  return (
    <>
      <AddButton
        trigger={trigger}
        triggerClassName={triggerClassName}
        triggerLabel={triggerLabel}
        onClick={open}
      />

      <LeadOriginFormDialog
        dialogRef={dialogRef}
        title={title}
        submitLabel={submitLabel}
        defaultValues={defaultValues}
        action={action}
        onDone={handleDone}
      />
    </>
  );
}
