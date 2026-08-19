import { thClass, tableHeadRowClass } from "@/components/table/table-styles";
import { AddContactModal } from "./add-contact-modal";
import { ContactRow } from "./contact-row";
import type { LeadContact } from "../queries";

/**
 * The Contacts sub-tab: the lead's additional contacts (beyond the main contact
 * on the form), as a table plus Add.
 */
export function ContactsPanel({
  leadId,
  contacts,
}: {
  leadId: string;
  contacts: LeadContact[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddContactModal leadId={leadId} />
      </div>

      <div className="rounded-xl border border-edge bg-surface shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Name</th>
                <th className={thClass}>Position</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Landline</th>
                <th className={thClass}>Website</th>
                <th className={thClass}>Email</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <ContactRow key={contact.id} contact={contact} leadId={leadId} />
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-ink-faint"
                  >
                    No additional contacts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
