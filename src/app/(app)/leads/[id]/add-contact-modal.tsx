"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { ContactFormDialog } from "./contact-form-dialog";
import { addLeadContact } from "../actions";

export function AddContactModal({ leadId }: { leadId: string }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <>
      <AddButton trigger="Add contact" onClick={open} />
      <ContactFormDialog
        dialogRef={dialogRef}
        title="Add contact"
        submitLabel="Add"
        action={addLeadContact.bind(null, leadId)}
        onDone={close}
      />
    </>
  );
}
