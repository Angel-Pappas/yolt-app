"use client";

import { useRef, useState } from "react";
import { CalendarIcon } from "@/components/icons";
import { displayToIso, isoToDisplay } from "@/lib/format";

type DateFieldProps = {
  /** The field's value as ISO "yyyy-mm-dd", or "" for empty. */
  value: string;
  /** Called with a valid ISO "yyyy-mm-dd", or "" when the field is cleared. */
  onChange: (isoDate: string) => void;
  /**
   * When set, a hidden input submits the ISO value under this name with the
   * surrounding <form>. The visible text box is intentionally nameless so the
   * dd/mm/yyyy string is never what gets submitted.
   */
  name?: string;
  id?: string;
  required?: boolean;
  /**
   * Show the calendar-popup button. On everywhere by default; off in the
   * Add/Edit transaction dialog, where the user wants keyboard-only fast entry
   * (per explicit direction — see Summary.md "Dates").
   */
  showCalendar?: boolean;
  /** Applied to the visible text input, so each call site keeps its own field chrome (bordered form field vs. borderless filter box). */
  className?: string;
  "aria-label"?: string;
};

/**
 * A locale-independent date input: it always shows and accepts dd/mm/yyyy
 * regardless of the browser's region, unlike a native `<input type="date">`
 * whose on-screen format the app cannot control. The value it reads and emits
 * is always ISO "yyyy-mm-dd", so every consumer (Server Actions, URL filter
 * params, the DB `date` columns) is unchanged — only the on-screen format is
 * ours now. All dd/mm/yyyy <-> ISO conversion lives in lib/format.ts.
 */
export function DateField({
  value,
  onChange,
  name,
  id,
  required,
  showCalendar = true,
  className,
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => isoToDisplay(value));

  // Re-sync the visible text when the ISO value changes from OUTSIDE the field
  // (preset buttons, the edit dialog seeding a row, Date -> Invoice-date
  // mirroring). This is React's "adjust state during render when a prop
  // changes" pattern, not an effect: it runs before commit (no flash) and
  // avoids the cascading-render pitfall of setState-in-effect. Guarded so it
  // never clobbers what the user is mid-typing — it only overwrites when the
  // current text doesn't already represent the incoming value.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (displayToIso(text) !== value) {
      setText(isoToDisplay(value));
    }
  }

  function commit(next: string) {
    setText(next);
    const iso = displayToIso(next);
    if (iso) {
      onChange(iso);
    } else if (next.trim() === "") {
      onChange("");
    }
    // A partially-typed or invalid value pushes nothing: the last valid value
    // stands until the user completes a real date or clears the field.
  }

  function handleBlur() {
    // Never leave an unparseable string on screen: snap back to the canonical
    // dd/mm/yyyy of whatever valid value the field holds ("" if empty).
    if (displayToIso(text) !== value) {
      setText(isoToDisplay(value));
    }
  }

  function openCalendar() {
    const el = nativeRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      // showPicker() can throw if the browser doesn't support it or the call
      // isn't user-activated; typing still works, so a failed open is harmless.
    }
  }

  return (
    <span className="relative flex items-center">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/yyyy"
        aria-label={ariaLabel}
        required={required}
        value={text}
        onChange={(e) => commit(e.target.value)}
        onBlur={handleBlur}
        className={className}
        // Inline (not a Tailwind `pr-*`) so it reliably beats the padding baked
        // into the caller's class — appending a `pr-*` can silently lose to the
        // existing `px-*` because Tailwind's cascade order isn't string order
        // (see Directions.md Direction 5).
        style={showCalendar ? { paddingRight: "2.25rem" } : undefined}
      />
      {name && <input type="hidden" name={name} value={value} />}
      {showCalendar && (
        <>
          <button
            type="button"
            tabIndex={-1}
            onClick={openCalendar}
            aria-label="Open calendar"
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-ink-faint transition hover:text-ink"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
          {/*
            The real calendar. Kept rendered (not display:none) but visually
            tiny so showPicker() has an anchor to open against; the ISO value
            flows straight through. tabIndex/aria-hidden keep it out of the tab
            order and the accessibility tree — the visible text box is the
            labelled control. [color-scheme:light] keeps the popup light in
            dark theme, matching the native inputs this replaced.
          */}
          <input
            ref={nativeRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pointer-events-none absolute right-2 bottom-0 h-px w-px opacity-0 [color-scheme:light]"
          />
        </>
      )}
    </span>
  );
}
