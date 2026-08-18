"use client";

import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteLead } from "./actions";
import type { LeadListItem } from "./queries";

export function LeadRow({ lead }: { lead: LeadListItem }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={tableRowClass({ interactive: true })}
    >
      <td className="px-4 py-3 text-sm font-medium text-ink">{lead.name}</td>
      <td className="px-4 py-3 text-sm text-ink-muted">{lead.phone ?? "—"}</td>
      <td className="px-4 py-3 text-sm text-ink-muted">{lead.email ?? "—"}</td>
      <td className="px-4 py-3 text-sm">
        {lead.status_name ? (
          <span className="inline-flex rounded-full border border-edge bg-canvas px-2 py-0.5 text-xs font-medium text-ink-muted">
            {lead.status_name}
          </span>
        ) : (
          <span className="text-ink-faint">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted tabular-nums">
        {formatDate(lead.created_at.slice(0, 10))}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteLead(lead.id)}
          confirmMessage="Delete this lead?"
          label="Delete lead"
        />
      </td>
    </tr>
  );
}
