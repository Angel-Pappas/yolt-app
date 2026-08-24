"use client";

import { useState, useTransition } from "react";
import { ProjectFields } from "../project-fields";
import { updateProject } from "../actions";
import type { ProjectStatus } from "../../settings/project-statuses/queries";
import type { ProjectDetail } from "../queries";

export function ProjectEditForm({
  project,
  statuses,
}: {
  project: ProjectDetail;
  statuses: ProjectStatus[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        // updateProject returns { error } rather than throwing (Next.js
        // sanitizes thrown Server Action errors in production).
        const result = await updateProject(project.id, formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <ProjectFields statuses={statuses} defaultValues={project} />

      {error && (
        <p
          className="mt-5 rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-end gap-4">
        {saved && !isPending && <span className="text-sm text-success">Saved</span>}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
