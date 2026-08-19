"use client";

import { useId, useState } from "react";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import { OriginCombobox } from "./origin-combobox";
import type { LeadOrigin } from "../settings/lead-origins/queries";
import type { LeadStatus } from "../settings/lead-statuses/queries";

export type LeadFieldValues = {
  name?: string;
  sort_order?: number | null;
  origin_id?: string | null;
  status_id?: string | null;
  website?: string | null;
  contact_name?: string | null;
  contact_position?: string | null;
  contact_phone?: string | null;
  contact_landline?: string | null;
  contact_email?: string | null;
  description?: string | null;
  next_step?: string | null;
  campaign_platform?: string | null;
  campaign_we_are?: string | null;
  campaign_we_want?: string | null;
};

const fieldsetLegendClass =
  "text-xs font-semibold tracking-wider text-ink-faint uppercase";

/**
 * The lead's own fields (everything except the History/Contacts sub-tabs),
 * shared by the Add modal and the Edit page so there's one definition. The
 * origin picker's "+ Add" dialog is owned by the parent (a sibling of the form)
 * and opened via `onAddOrigin`.
 */
export function LeadFields({
  origins,
  statuses,
  defaultValues,
  onAddOrigin,
}: {
  origins: LeadOrigin[];
  statuses: LeadStatus[];
  defaultValues?: LeadFieldValues;
  onAddOrigin: () => void;
}) {
  const uid = useId();
  const currentOrigin =
    origins.find((o) => o.id === defaultValues?.origin_id) ?? null;

  // The Campaign origin, if it exists — its extra fields (Platform / We are /
  // We want) show only while it's the selected origin.
  const campaignOriginId =
    origins.find((o) => o.name.trim().toLowerCase() === "campaign")?.id ?? null;
  const [selectedOriginId, setSelectedOriginId] = useState(
    defaultValues?.origin_id ?? ""
  );
  const showCampaign =
    campaignOriginId !== null && selectedOriginId === campaignOriginId;

  // Phone fields accept digits only.
  function digitsOnly(e: React.FormEvent<HTMLInputElement>) {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className={formLabelClass}>No.</span>
        {/* Read-only: the number is auto-assigned by the DB when the lead is
            saved (a sequence, never reused). Blank on the Add form. */}
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
        <div className="sm:col-span-2">
          <OriginCombobox
            origins={origins}
            defaultValue={currentOrigin}
            onAddNew={onAddOrigin}
            onChange={setSelectedOriginId}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-website`} className={formLabelClass}>
            Website
          </label>
          <input
            id={`${uid}-website`}
            name="website"
            type="text"
            defaultValue={defaultValues?.website ?? ""}
            className={formInputClass}
          />
        </div>
      </div>

      {/* Campaign-only fields — visible only while the origin is Campaign. When
          hidden they aren't submitted, so switching away from Campaign and
          saving clears them (schema turns the missing fields into null). */}
      {showCampaign && (
        <fieldset className="grid gap-4 rounded-lg border border-edge bg-canvas p-4 sm:grid-cols-2">
          <legend className={`${fieldsetLegendClass} px-1`}>Campaign</legend>
          <div>
            <label htmlFor={`${uid}-cplatform`} className={formLabelClass}>
              Platform
            </label>
            <select
              id={`${uid}-cplatform`}
              name="campaign_platform"
              defaultValue={defaultValues?.campaign_platform ?? ""}
              className={formInputClass}
            >
              <option value="">— None —</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div className="hidden sm:block" aria-hidden />
          <div>
            <label htmlFor={`${uid}-weare`} className={formLabelClass}>
              We are
            </label>
            <input
              id={`${uid}-weare`}
              name="campaign_we_are"
              type="text"
              defaultValue={defaultValues?.campaign_we_are ?? ""}
              className={formInputClass}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-wewant`} className={formLabelClass}>
              We want
            </label>
            <input
              id={`${uid}-wewant`}
              name="campaign_we_want"
              type="text"
              defaultValue={defaultValues?.campaign_we_want ?? ""}
              className={formInputClass}
            />
          </div>
        </fieldset>
      )}

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
            defaultValue={defaultValues?.contact_name ?? ""}
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-cposition`} className={formLabelClass}>
            Position
          </label>
          <input
            id={`${uid}-cposition`}
            name="contact_position"
            type="text"
            defaultValue={defaultValues?.contact_position ?? ""}
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
            defaultValue={defaultValues?.contact_email ?? ""}
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
            inputMode="numeric"
            onInput={digitsOnly}
            defaultValue={defaultValues?.contact_phone ?? ""}
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
            inputMode="numeric"
            onInput={digitsOnly}
            defaultValue={defaultValues?.contact_landline ?? ""}
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
          defaultValue={defaultValues?.description ?? ""}
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
          placeholder="e.g. Call again, send offer, follow-up call set for…"
          className={formInputClass}
        />
      </div>
    </div>
  );
}
