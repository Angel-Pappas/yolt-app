"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { formatPhone } from "@/lib/format";
import { ContactFormDialog } from "./contact-form-dialog";
import { updateLeadContact, deleteLeadContact } from "../actions";
import type { LeadContact } from "../queries";

export function ContactRow({
  contact,
  leadId,
}: {
  contact: LeadContact;
  leadId: string;
}) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass({ interactive: true })}>
      <td className="px-4 py-3 text-sm font-medium text-ink">
        {contact.name ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted">
        {contact.position ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted tabular-nums">
        {contact.phone ? formatPhone(contact.phone) : "—"}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted tabular-nums">
        {contact.landline ? formatPhone(contact.landline) : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted">
        {contact.website ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted">{contact.email ?? "—"}</td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteLeadContact(contact.id, leadId)}
          confirmMessage="Delete this contact?"
          label="Delete contact"
        />

        <ContactFormDialog
          dialogRef={dialogRef}
          title="Edit contact"
          submitLabel="Save"
          defaultValues={{
            name: contact.name ?? "",
            position: contact.position,
            phone: contact.phone,
            landline: contact.landline,
            website: contact.website,
            email: contact.email,
          }}
          action={updateLeadContact.bind(null, contact.id, leadId)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
