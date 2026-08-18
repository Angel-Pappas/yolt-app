"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { LeadFormDialog, type LeadDefaultValues } from "./lead-form-dialog";
import type { LeadStatus } from "../settings/lead-statuses/queries";

type LeadModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  statuses: LeadStatus[];
  defaultValues?: LeadDefaultValues;
  action: (formData: FormData) => Promise<void>;
  onDone?: () => void;
};

export function LeadModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  statuses,
  defaultValues,
  action,
  onDone,
}: LeadModalProps) {
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

      <LeadFormDialog
        dialogRef={dialogRef}
        title={title}
        submitLabel={submitLabel}
        statuses={statuses}
        defaultValues={defaultValues}
        action={action}
        onDone={handleDone}
      />
    </>
  );
}
