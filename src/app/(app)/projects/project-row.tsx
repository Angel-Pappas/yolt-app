"use client";

import Link from "next/link";
import { formatAmount } from "@/lib/format";
import { DeleteButton } from "@/components/dialog/delete-button";
import { deleteProject } from "./actions";
import { EditableNextStep } from "./editable-next-step";
import { EditableStatus } from "./editable-status";
import type { ProjectListItem } from "./queries";

type StatusOption = { value: string; label: string };

export function ProjectRow({
  project,
  index,
  statusOptions,
}: {
  project: ProjectListItem;
  index: number;
  statusOptions: StatusOption[];
}) {
  // Index-driven zebra striping (consistent with the leads table).
  const stripe = index % 2 === 1 ? "bg-surface-alt" : "";

  return (
    <tr
      className={`group relative border-b border-edge transition-colors hover:bg-canvas ${stripe}`}
    >
      <td className="px-4 py-3 align-middle text-sm tabular-nums text-ink-muted">
        {project.sort_order ?? <span className="text-ink-faint">—</span>}
      </td>
      <td className="px-4 py-3 align-middle text-sm font-medium text-ink">
        {/* Stretched link: a real <a> so middle/Ctrl-click open in a new tab. */}
        <Link
          href={`/projects/${project.id}`}
          className="rounded-sm outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:ring-2 focus-visible:ring-accent"
        >
          {project.name}
        </Link>
      </td>
      <td className="px-4 py-3 align-middle text-sm text-ink-muted">
        {project.contact_name ?? "—"}
      </td>
      <td className="px-4 py-3 align-middle text-sm">
        <div className="relative z-10 inline-block">
          <EditableStatus
            projectId={project.id}
            statusId={project.status_id}
            statusName={project.status_name}
            options={statusOptions}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-right align-middle text-sm whitespace-nowrap tabular-nums text-ink">
        {project.value != null ? (
          `€ ${formatAmount(project.value)}`
        ) : (
          <span className="text-ink-faint">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-middle text-sm text-ink-muted">
        <div className="relative z-10">
          <EditableNextStep projectId={project.id} value={project.next_step} />
        </div>
      </td>
      <td className="px-4 py-3 text-right align-middle">
        <div className="relative z-10 flex items-center justify-end">
          <DeleteButton
            action={() => deleteProject(project.id)}
            confirmMessage="Delete this project?"
            label="Delete project"
          />
        </div>
      </td>
    </tr>
  );
}
