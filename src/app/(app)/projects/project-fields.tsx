"use client";

import { useId } from "react";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import { sanitizeAmountInput } from "@/lib/format";
import type { ProjectStatus } from "../settings/project-statuses/queries";

export type ProjectFieldValues = {
  name?: string;
  sort_order?: number | null;
  status_id?: string | null;
  value?: number | null;
  estimated_months?: number | null;
  description?: string | null;
  next_step?: string | null;
};

/**
 * The project's own fields (everything except the History sub-tab), shared by
 * the Add modal and the Edit page so there's one definition. Deliberately holds
 * only project information — client/contact details live on the linked lead and
 * are never copied here.
 */
export function ProjectFields({
  statuses,
  defaultValues,
}: {
  statuses: ProjectStatus[];
  defaultValues?: ProjectFieldValues;
}) {
  const uid = useId();

  function sanitizeAmount(e: React.FormEvent<HTMLInputElement>) {
    e.currentTarget.value = sanitizeAmountInput(e.currentTarget.value);
  }
  function digitsOnly(e: React.FormEvent<HTMLInputElement>) {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className={formLabelClass}>No.</span>
        {/* Read-only: auto-assigned by the DB on save (a sequence, never reused). */}
        <p className="w-full rounded-lg border border-edge bg-canvas px-3 py-2 text-sm text-ink-muted tabular-nums">
          {defaultValues?.sort_order != null
            ? defaultValues.sort_order
            : "Auto-assigned"}
        </p>
      </div>

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
            autoFocus
            defaultValue={defaultValues?.name}
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
            defaultValue={defaultValues?.status_id ?? ""}
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
        <div>
          <label htmlFor={`${uid}-value`} className={formLabelClass}>
            Value (€)
          </label>
          <input
            id={`${uid}-value`}
            name="value"
            type="text"
            inputMode="decimal"
            onInput={sanitizeAmount}
            defaultValue={
              defaultValues?.value != null ? String(defaultValues.value) : ""
            }
            placeholder="Agreed amount"
            className={`${formInputClass} tabular-nums`}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-months`} className={formLabelClass}>
            Estimated duration (months)
          </label>
          <input
            id={`${uid}-months`}
            name="estimated_months"
            type="text"
            inputMode="numeric"
            onInput={digitsOnly}
            defaultValue={
              defaultValues?.estimated_months != null
                ? String(defaultValues.estimated_months)
                : ""
            }
            placeholder="e.g. 2"
            className={`${formInputClass} tabular-nums`}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-description`} className={formLabelClass}>
          Description
        </label>
        <textarea
          id={`${uid}-description`}
          name="description"
          rows={5}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="The detailed scope of the project"
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
          defaultValue={defaultValues?.next_step ?? ""}
          placeholder="e.g. Send the contract, schedule kick-off"
          className={formInputClass}
        />
      </div>
    </div>
  );
}
