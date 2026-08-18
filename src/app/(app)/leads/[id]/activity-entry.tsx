"use client";

import { formatDate } from "@/lib/format";
import { DeleteButton } from "@/components/dialog/delete-button";
import { deleteLeadActivity } from "../actions";
import type { LeadActivity } from "../queries";

export function ActivityEntry({
  activity,
  leadId,
}: {
  activity: LeadActivity;
  leadId: string;
}) {
  return (
    <div className="rounded-lg border border-edge bg-canvas p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink-muted">
          {activity.author_name ?? "Someone"} ·{" "}
          {formatDate(activity.created_at.slice(0, 10))}
        </span>
        <DeleteButton
          action={() => deleteLeadActivity(activity.id, leadId)}
          confirmMessage="Delete this entry?"
          label="Delete entry"
        />
      </div>
      <p className="text-sm whitespace-pre-wrap text-ink">{activity.body}</p>
    </div>
  );
}
