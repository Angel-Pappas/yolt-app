"use client";

import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/format";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteLead } from "./actions";
import { EditableNextStep } from "./editable-next-step";
import { EditableStatus } from "./editable-status";
import { RowAddAction } from "./row-add-action";
import type { LeadListItem, UserOption } from "./queries";

type StatusOption = { value: string; label: string };

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-edge bg-canvas px-2 py-0.5 text-xs font-medium text-ink-muted">
      {label}
    </span>
  );
}

export function LeadRow({
  lead,
  users,
  isAdmin,
  currentUserId,
  statusOptions,
}: {
  lead: LeadListItem;
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
  statusOptions: StatusOption[];
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={tableRowClass({ interactive: true })}
    >
      <td className="px-4 py-3 align-middle text-sm">
        {lead.origin_name ? <Pill label={lead.origin_name} /> : <span className="text-ink-faint">—</span>}
      </td>
      <td className="px-4 py-3 align-middle text-sm font-medium text-ink">
        {lead.name}
      </td>
      <td className="px-4 py-3 align-middle text-sm text-ink-muted">
        {lead.contact_email ?? "—"}
      </td>
      <td className="px-4 py-3 align-middle text-sm whitespace-nowrap text-ink-muted tabular-nums">
        {lead.contact_phone ? formatPhone(lead.contact_phone) : "—"}
      </td>
      <td className="px-4 py-3 align-middle text-sm text-ink-muted">
        <div className="max-w-[20rem] break-words whitespace-normal">
          {lead.description ?? "—"}
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-sm text-ink-muted">
        <EditableNextStep leadId={lead.id} value={lead.next_step} />
      </td>
      <td
        className="px-4 py-3 align-middle text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <EditableStatus
          leadId={lead.id}
          statusId={lead.status_id}
          statusName={lead.status_name}
          options={statusOptions}
        />
      </td>
      <td className="px-4 py-3 text-right align-middle" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end">
          <RowAddAction
            leadId={lead.id}
            users={users}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
          <DeleteButton
            action={() => deleteLead(lead.id)}
            confirmMessage="Delete this lead?"
            label="Delete lead"
          />
        </div>
      </td>
    </tr>
  );
}
