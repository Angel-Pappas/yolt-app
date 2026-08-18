"use client";

import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteLead } from "./actions";
import type { LeadListItem } from "./queries";

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-edge bg-canvas px-2 py-0.5 text-xs font-medium text-ink-muted">
      {label}
    </span>
  );
}

export function LeadRow({ lead }: { lead: LeadListItem }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={tableRowClass({ interactive: true })}
    >
      <td className="px-4 py-3 align-top text-sm font-medium text-ink">{lead.name}</td>
      <td className="px-4 py-3 align-top text-sm">
        {lead.origin_name ? <Pill label={lead.origin_name} /> : <span className="text-ink-faint">—</span>}
      </td>
      <td className="px-4 py-3 align-top text-sm">
        {lead.status_name ? <Pill label={lead.status_name} /> : <span className="text-ink-faint">—</span>}
      </td>
      <td className="px-4 py-3 align-top text-sm text-ink-muted">
        <div className="max-w-[14rem] break-words whitespace-normal">
          {lead.next_step ?? "—"}
        </div>
      </td>
      <td className="px-4 py-3 align-top text-sm text-ink-muted">
        <div className="max-w-[20rem] break-words whitespace-normal">
          {lead.description ?? "—"}
        </div>
      </td>
      <td className="px-4 py-3 align-top text-sm whitespace-nowrap text-ink-muted tabular-nums">
        {formatDate(lead.created_at.slice(0, 10))}
      </td>
      <td className="px-4 py-3 text-right align-top" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteLead(lead.id)}
          confirmMessage="Delete this lead?"
          label="Delete lead"
        />
      </td>
    </tr>
  );
}
