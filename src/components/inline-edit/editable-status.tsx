"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type Option = { value: string; label: string };

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-edge bg-canvas px-2 py-0.5 text-xs font-medium text-ink-muted">
      {label}
    </span>
  );
}

/**
 * Inline-editable "Status" cell — click the pill to open a status dropdown and
 * save on selection, without opening the record. Shared by the Leads and
 * Projects lists; the caller supplies `onSave` (a bound Server Action).
 * stopPropagation everywhere so a click never triggers the row's
 * navigate-to-edit behaviour.
 */
export function EditableStatus({
  statusId,
  statusName,
  options,
  onSave,
}: {
  statusId: string | null;
  statusName: string | null;
  options: Option[];
  onSave: (statusId: string | null) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectRef = useRef<HTMLSelectElement>(null);

  // Open the native dropdown immediately when entering edit mode, so it's a
  // single click. showPicker() needs recent user activation (the pill click
  // provides it); fall back to focus if the browser refuses.
  useEffect(() => {
    if (!editing) return;
    const el = selectRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  }, [editing]);

  function save(next: string) {
    const value = next || null;
    if (value === statusId) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      try {
        await onSave(value);
      } finally {
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        title="Click to change status"
        className="-mx-1 rounded-md px-1 py-0.5 hover:bg-canvas disabled:opacity-50"
      >
        {statusName ? (
          <Pill label={statusName} />
        ) : (
          <span className="text-ink-faint">—</span>
        )}
      </button>
    );
  }

  return (
    <select
      ref={selectRef}
      defaultValue={statusId ?? ""}
      autoFocus
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => save(e.target.value)}
      onBlur={() => setEditing(false)}
      className="max-w-[10rem] rounded-md border border-edge bg-surface px-2 py-1 text-xs text-ink"
    >
      <option value="">— None —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
