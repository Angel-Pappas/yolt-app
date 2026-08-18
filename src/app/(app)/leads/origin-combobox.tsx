"use client";

import { useId, useMemo, useState } from "react";
import { formLabelClass } from "@/components/form-styles";
import type { LeadOrigin } from "../settings/lead-origins/queries";

type OriginComboboxProps = {
  origins: LeadOrigin[];
  defaultValue?: { id: string; name: string } | null;
  onAddNew: () => void;
};

/**
 * Search-and-select over the already-loaded origin list, with a "+ Add" that
 * opens the create-origin dialog (wired by the parent as a sibling of the form).
 * Same shape as the transaction form's entity combobox. Fills a hidden
 * `origin_id` input; leaving it blank submits no origin.
 */
export function OriginCombobox({
  origins,
  defaultValue,
  onAddNew,
}: OriginComboboxProps) {
  const uid = useId();
  const [query, setQuery] = useState(defaultValue?.name ?? "");
  const [selectedId, setSelectedId] = useState(defaultValue?.id ?? "");
  const [isOpen, setIsOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? origins.filter((o) => o.name.toLowerCase().includes(q))
      : origins;
    return list.slice(0, 20);
  }, [origins, query]);

  function selectOrigin(origin: LeadOrigin) {
    setSelectedId(origin.id);
    setQuery(origin.name);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor={`${uid}-origin`} className={formLabelClass}>
        Lead origin
      </label>
      <div className="flex gap-2">
        <input
          id={`${uid}-origin`}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId("");
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          autoComplete="off"
          placeholder="Search origins…"
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center whitespace-nowrap rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-edge-strong hover:text-ink"
        >
          + Add
        </button>
      </div>
      <input type="hidden" name="origin_id" value={selectedId} />

      {isOpen && matches.length > 0 && (
        <ul className="absolute z-10 mt-1.5 max-h-48 w-full overflow-auto rounded-lg border border-edge bg-surface-raised p-1 text-sm shadow-[var(--shadow-pop)]">
          {matches.map((origin) => (
            <li key={origin.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOrigin(origin)}
                className="block w-full rounded-md px-2.5 py-1.5 text-left text-ink hover:bg-canvas"
              >
                {origin.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
