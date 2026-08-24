"use client";

import { useState, useTransition } from "react";
import { formInputClass } from "@/components/form-styles";
import { updateProjectNextStep } from "./actions";

/**
 * Inline-editable Next step cell on the projects list — click to edit without
 * opening the project. stopPropagation everywhere so a click never triggers the
 * row's navigate-to-edit behaviour.
 */
export function EditableNextStep({
  projectId,
  value,
}: {
  projectId: string;
  value: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setText(value ?? "");
    setEditing(true);
  }

  function save() {
    startTransition(async () => {
      try {
        await updateProjectNextStep(projectId, text);
        setEditing(false);
      } catch {
        // Leave the editor open so the typed text isn't lost.
      }
    });
  }

  function cancel() {
    setText(value ?? "");
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
        className="-mx-1 max-w-[14rem] cursor-text rounded-md px-1 py-0.5 break-words whitespace-normal hover:bg-canvas"
      >
        {value ? value : <span className="text-ink-faint">—</span>}
      </div>
    );
  }

  return (
    <div className="max-w-[14rem]" onClick={(e) => e.stopPropagation()}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            save();
          }
        }}
        className={formInputClass}
      />
      <div className="mt-1 flex gap-3 text-xs">
        <button
          type="button"
          disabled={isPending}
          onClick={save}
          className="font-semibold text-accent hover:underline disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="text-ink-faint hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
