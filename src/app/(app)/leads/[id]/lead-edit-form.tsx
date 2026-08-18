"use client";

import { useId, useState, useTransition } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import { OriginCombobox } from "../origin-combobox";
import { updateLead } from "../actions";
import { LeadOriginFormDialog } from "../../settings/lead-origins/lead-origin-form-dialog";
import { addLeadOrigin } from "../../settings/lead-origins/actions";
import type { LeadOrigin } from "../../settings/lead-origins/queries";
import type { LeadStatus } from "../../settings/lead-statuses/queries";
import type { LeadDetail } from "../queries";

const fieldsetLegendClass =
  "text-xs font-semibold tracking-wider text-ink-faint uppercase";

export function LeadEditForm({
  lead,
  origins,
  statuses,
}: {
  lead: LeadDetail;
  origins: LeadOrigin[];
  statuses: LeadStatus[];
}) {
  const uid = useId();
  const originDialog = useDialog();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentOrigin = origins.find((o) => o.id === lead.origin_id) ?? null;

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
        className="flex flex-col gap-5 rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-name`} className={formLabelClass}>
              Name
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              required
              defaultValue={lead.name}
              className={formInputClass}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-status`} className={formLabelClass}>
              Status
            </label>
            <select
              id={`${uid}-status`}
              name="status_id"
              defaultValue={lead.status_id ?? ""}
              className={formInputClass}
            >
              <option value="">— None —</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <OriginCombobox
              origins={origins}
              defaultValue={currentOrigin}
              onAddNew={originDialog.open}
            />
          </div>
        </div>

        <fieldset className="grid gap-4 rounded-lg border border-edge bg-canvas p-4 sm:grid-cols-2">
          <legend className={`${fieldsetLegendClass} px-1`}>Main contact</legend>
          <div>
            <label htmlFor={`${uid}-cname`} className={formLabelClass}>
              Contact name
            </label>
            <input
              id={`${uid}-cname`}
              name="contact_name"
              type="text"
              defaultValue={lead.contact_name ?? ""}
              className={formInputClass}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-cemail`} className={formLabelClass}>
              Email
            </label>
            <input
              id={`${uid}-cemail`}
              name="contact_email"
              type="text"
              defaultValue={lead.contact_email ?? ""}
              className={formInputClass}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-cphone`} className={formLabelClass}>
              Phone
            </label>
            <input
              id={`${uid}-cphone`}
              name="contact_phone"
              type="text"
              defaultValue={lead.contact_phone ?? ""}
              className={formInputClass}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-clandline`} className={formLabelClass}>
              Landline
            </label>
            <input
              id={`${uid}-clandline`}
              name="contact_landline"
              type="text"
              defaultValue={lead.contact_landline ?? ""}
              className={formInputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-cwebsite`} className={formLabelClass}>
              Website
            </label>
            <input
              id={`${uid}-cwebsite`}
              name="contact_website"
              type="text"
              defaultValue={lead.contact_website ?? ""}
              className={formInputClass}
            />
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${uid}-description`} className={formLabelClass}>
            Description
          </label>
          <textarea
            id={`${uid}-description`}
            name="description"
            rows={4}
            defaultValue={lead.description ?? ""}
            className={formInputClass}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-next`} className={formLabelClass}>
            Next step
          </label>
          <textarea
            id={`${uid}-next`}
            name="next_step"
            rows={2}
            defaultValue={lead.next_step ?? ""}
            placeholder="e.g. Call again, send offer, follow-up call set for…"
            className={formInputClass}
          />
        </div>

        {error && (
          <p
            className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-4">
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

      {/* Sibling of the form (not nested) — a <form> can't contain a <dialog>'s
          own <form>. Creating an origin here refreshes the picker's list. */}
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
