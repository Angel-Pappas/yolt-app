"use client";

import { useState, useTransition } from "react";
import { updateLeadSortOrder } from "./actions";

/**
 * Inline-editable ordering number on the leads list — click the cell to type a
 * number without opening the lead; Enter or blur saves, Escape cancels. Empty
 * clears it back to no value. stopPropagation everywhere so a click never
 * triggers the row's navigate-to-edit behaviour.
 */
export function EditableOrder({
  leadId,
  value,
}: {
  leadId: string;
  value: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value == null ? "" : String(value));
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setText(value == null ? "" : String(value));
    setEditing(true);
  }

  function save() {
    const next = text.trim() === "" ? null : Number(text);
    if (next === value) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      try {
        await updateLeadSortOrder(leadId, next);
        setEditing(false);
      } catch {
        // Leave the editor open so the typed value isn't lost.
      }
    });
  }

  function cancel() {
    setText(value == null ? "" : String(value));
    setEditing(false);
  }

  if (!editing) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          startEdit();
        }}
        title="Click to edit"
        className="-mx-1 min-w-8 cursor-text rounded-md px-1 py-0.5 tabular-nums hover:bg-canvas"
      >
        {value == null ? <span className="text-ink-faint">—</span> : value}
      </div>
    );
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      autoFocus
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      // Digits only — this is a plain ordering index.
      onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          save();
        } else if (e.key === "Escape") {
          cancel();
        }
      }}
      className="w-14 rounded-md border border-edge bg-surface px-2 py-1 text-sm tabular-nums text-ink"
    />
  );
}
