"use client";

import { useState, useTransition } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { LeadFields } from "../lead-fields";
import { updateLead } from "../actions";
import { LeadOriginFormDialog } from "../../settings/lead-origins/lead-origin-form-dialog";
import { addLeadOrigin } from "../../settings/lead-origins/actions";
import type { LeadOrigin } from "../../settings/lead-origins/queries";
import type { LeadStatus } from "../../settings/lead-statuses/queries";
import type { LeadDetail } from "../queries";

export function LeadEditForm({
  lead,
  origins,
  statuses,
}: {
  lead: LeadDetail;
  origins: LeadOrigin[];
  statuses: LeadStatus[];
}) {
  const originDialog = useDialog();
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
        await updateLead(lead.id, formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)]"
      >
        <LeadFields
          origins={origins}
          statuses={statuses}
          defaultValues={lead}
          onAddOrigin={originDialog.open}
        />

        {error && (
          <p
            className="mt-5 rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-4">
          {saved && !isPending && (
            <span className="text-sm text-success">Saved</span>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {/* Sibling of the form (not nested) — creating an origin refreshes the picker. */}
      <LeadOriginFormDialog
        dialogRef={originDialog.dialogRef}
        title="Add origin"
        submitLabel="Add"
        action={addLeadOrigin}
        onDone={originDialog.close}
      />
    </>
  );
}
