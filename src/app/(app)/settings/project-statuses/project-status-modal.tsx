"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { ProjectStatusFormDialog } from "./project-status-form-dialog";

type ProjectStatusModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  defaultValues?: { name: string };
  action: (formData: FormData) => Promise<void | { error?: string | null }>;
  onDone?: () => void;
};

export function ProjectStatusModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  defaultValues,
  action,
  onDone,
}: ProjectStatusModalProps) {
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

      <ProjectStatusFormDialog
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
