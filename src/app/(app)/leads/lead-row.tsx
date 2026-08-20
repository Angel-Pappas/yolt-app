"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/format";
import { DeleteButton } from "@/components/dialog/delete-button";
import { ChevronIcon } from "@/components/icons";
import { deleteLead } from "./actions";
import { EditableNextStep } from "./editable-next-step";
import { EditableStatus } from "./editable-status";
import { RowAddAction } from "./row-add-action";
import type { LeadListItem, UserOption } from "./queries";

type StatusOption = { value: string; label: string };

// Total columns in the table body (No., Origin, Name, Email, Phone, Next step,
// Status, actions) — used as the expanded detail row's colSpan.
const COLUMN_COUNT = 8;

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-edge bg-canvas px-2 py-0.5 text-xs font-medium text-ink-muted">
      {label}
    </span>
  );
}

export function LeadRow({
  lead,
  index,
  users,
  isAdmin,
  currentUserId,
  statusOptions,
}: {
  lead: LeadListItem;
  index: number;
  users: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
  statusOptions: StatusOption[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const hasDescription = Boolean(lead.description && lead.description.trim());

  // Zebra striping is index-driven here (not the shared `even:` nth-child rule)
  // because an expanded row inserts a second <tr>, which would otherwise flip
  // the parity of every row below it. The main row and its detail row share the
  // same stripe so the pair reads as one unit.
  const stripe = index % 2 === 1 ? "bg-surface-alt" : "";

  return (
    <>
      <tr
        onClick={() => router.push(`/leads/${lead.id}`)}
        className={`group cursor-pointer border-edge transition-colors hover:bg-canvas ${stripe} ${
          expanded ? "" : "border-b"
        }`}
      >
        <td className="px-4 py-3 align-middle text-sm tabular-nums text-ink-muted">
          {lead.sort_order ?? <span className="text-ink-faint">—</span>}
        </td>
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
            {hasDescription && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? "Hide description" : "Show description"}
                aria-expanded={expanded}
                title={expanded ? "Hide description" : "Show description"}
                className={`rounded-lg p-2 transition-colors hover:bg-canvas ${
                  expanded ? "text-accent" : "text-ink-faint hover:text-ink"
                }`}
              >
                <ChevronIcon
                  className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                />
              </button>
            )}
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

      {expanded && (
        <tr className={`border-b border-edge ${stripe}`}>
          <td colSpan={COLUMN_COUNT} className="px-4 pb-4 pt-1 align-top">
            <p className="max-w-3xl border-l-2 border-accent pl-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-muted">
              {lead.description}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
