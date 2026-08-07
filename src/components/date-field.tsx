"use client";

import { useRef, useState } from "react";
import { CalendarIcon } from "@/components/icons";
import { displayToIso } from "@/lib/format";

type DateFieldProps = {
  /** The field's value as ISO "yyyy-mm-dd", or "" for empty. */
  value: string;
  /** Called with a valid ISO "yyyy-mm-dd", or "" when the field is cleared. */
  onChange: (isoDate: string) => void;
  /**
   * When set, a hidden input submits the ISO value under this name with the
   * surrounding <form>. The visible segments are nameless so the dd/mm/yyyy
   * text is never what gets submitted.
   */
  name?: string;
  id?: string;
  required?: boolean;
  /**
   * Show the calendar-popup button. On everywhere by default; off in the
   * transaction-entry modals, where the user wants keyboard-only fast entry
   * (see Summary.md "Date inputs").
   */
  showCalendar?: boolean;
  /** Applied to the outer field box, so each call site keeps its own chrome (bordered form field vs. borderless filter box). */
  className?: string;
  "aria-label"?: string;
};

type Part = "d" | "m" | "y";
type Segments = { d: string; m: string; y: string };
const ORDER: Part[] = ["d", "m", "y"];

/** ISO "yyyy-mm-dd" -> the three segment strings, or all-empty if not a full ISO date. */
function splitIso(iso: string): Segments {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return { d: "", m: "", y: "" };
  return { d: match[3], m: match[2], y: match[1] };
}

/** The three segments -> ISO, or "" while incomplete/invalid (displayToIso is strict — it rejects impossible dates). */
function segmentsToIso(seg: Segments): string {
  return displayToIso(`${seg.d}/${seg.m}/${seg.y}`);
}

/**
 * A locale-independent, segmented date input that behaves like a native date
 * field's dd/mm/yyyy boxes — click a segment to select it, type to fill it and
 * auto-advance to the next, digits never spill across segments, and you never
 * type the "/". Unlike a native `<input type="date">`, the order is always
 * dd/mm/yyyy regardless of the browser's locale. The value it reads and emits
 * is always ISO "yyyy-mm-dd", so every consumer (Server Actions, URL filter
 * params, the DB `date` columns) is unchanged. dd/mm/yyyy <-> ISO parsing
 * lives in lib/format.ts (`displayToIso`).
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
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);
  const refs: Record<Part, React.RefObject<HTMLInputElement | null>> = {
    d: dayRef,
    m: monthRef,
    y: yearRef,
  };

  const [seg, setSeg] = useState<Segments>(() => splitIso(value));

  // Re-sync the segments when the ISO value changes from OUTSIDE the field
  // (preset buttons, the edit dialog seeding a row, Date -> Invoice-date
  // mirroring, the calendar popup). React's "adjust state during render when a
  // prop changes" pattern, not an effect: runs before commit (no flash) and
  // avoids the set-state-in-effect cascade. Guarded so it never clobbers what
  // the user is mid-typing — it only overwrites when the current segments
  // don't already represent the incoming value.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (segmentsToIso(seg) !== value) {
      setSeg(splitIso(value));
    }
  }

  function apply(next: Segments) {
    setSeg(next);
    const iso = segmentsToIso(next);
    if (iso) {
      onChange(iso);
    } else if (!next.d && !next.m && !next.y) {
      onChange("");
    }
    // A partial/incomplete date pushes nothing — the last valid value stands
    // until the field holds a complete real date or is fully cleared.
  }

  function focusPart(part: Part) {
    const el = refs[part].current;
    if (el) {
      el.focus();
      el.select();
    }
  }

  function moveFocus(from: Part, dir: 1 | -1) {
    const i = ORDER.indexOf(from) + dir;
    if (i >= 0 && i < ORDER.length) focusPart(ORDER[i]);
  }

  /** Handle a segment's input: keep digits only, clamp to its range, and auto-advance once it can't take another digit. */
  function handleInput(part: Part, raw: string) {
    if (part === "y") {
      const digits = raw.replace(/\D/g, "").slice(0, 4);
      apply({ ...seg, y: digits });
      return;
    }
    const hi = part === "d" ? 31 : 12;
    const firstDigitCap = part === "d" ? 3 : 1;
    let digits = raw.replace(/\D/g, "").slice(0, 2);
    let advance = false;
    if (digits.length === 2) {
      const n = Math.min(hi, Math.max(1, Number(digits)));
      digits = String(n).padStart(2, "0");
      advance = true;
    } else if (digits.length === 1 && Number(digits) > firstDigitCap) {
      // A first digit that can't start a valid two-digit value (e.g. day 4-9,
      // month 2-9) is the whole segment — pad it and move on.
      digits = digits.padStart(2, "0");
      advance = true;
    }
    apply({ ...seg, [part]: digits });
    if (advance) moveFocus(part, 1);
  }

  /** Arrow up/down nudges a segment within its range (day 1-31, month 1-12, year ±1), like a native date field's spinbuttons. */
  function step(part: Part, delta: 1 | -1) {
    if (part === "y") {
      const base = Number(seg.y) || new Date().getFullYear();
      apply({ ...seg, y: String(Math.max(1, base + delta)).padStart(4, "0") });
      return;
    }
    const hi = part === "d" ? 31 : 12;
    const base = Number(seg[part]) || (delta === 1 ? 0 : hi + 1);
    let n = base + delta;
    if (n > hi) n = 1;
    else if (n < 1) n = hi;
    apply({ ...seg, [part]: String(n).padStart(2, "0") });
  }

  function handleKeyDown(part: Part, e: React.KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      step(part, e.key === "ArrowUp" ? 1 : -1);
    } else if (e.key === "/" || e.key === "." || e.key === "-" || e.key === " ") {
      // Accept a typed separator as "next segment" — but you never need to.
      e.preventDefault();
      moveFocus(part, 1);
    } else if (e.key === "ArrowRight" && el.selectionStart === el.value.length) {
      e.preventDefault();
      moveFocus(part, 1);
    } else if (e.key === "ArrowLeft" && el.selectionStart === 0) {
      e.preventDefault();
      moveFocus(part, -1);
    } else if (e.key === "Backspace" && el.value === "") {
      // Deleting into an already-empty segment steps back to the previous one.
      e.preventDefault();
      moveFocus(part, -1);
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    // Only act when focus actually leaves the whole field, not when it hops
    // between this field's own segments.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    let { d, m, y } = seg;
    if (d) d = String(Math.min(31, Math.max(1, Number(d) || 1))).padStart(2, "0");
    if (m) m = String(Math.min(12, Math.max(1, Number(m) || 1))).padStart(2, "0");
    // A 1-2 digit year is read as 20xx (this app only deals in recent dates);
    // type all four digits for anything else.
    if (y && y.length <= 2) y = String(2000 + Number(y)).padStart(4, "0");
    const normalized: Segments = { d, m, y };
    if (segmentsToIso(normalized) || (!d && !m && !y)) {
      apply(normalized);
    } else {
      // Incomplete/invalid on the way out: snap back to the last valid value
      // rather than leaving a half-typed date on screen.
      setSeg(splitIso(value));
    }
  }

  function openCalendar() {
    const el = nativeRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      // showPicker() can throw if unsupported or not user-activated; the
      // segments still accept typed input, so a failed open is harmless.
    }
  }

  const segmentClass =
    "bg-transparent text-center tabular-nums text-ink outline-none placeholder:text-ink-faint";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      onBlur={handleBlur}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          focusPart("d");
        }
      }}
      className={`relative flex items-center gap-0.5 ${className ?? ""}`}
    >
      <input
        ref={dayRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        maxLength={2}
        required={required}
        placeholder="dd"
        aria-label="Day"
        value={seg.d}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => handleInput("d", e.target.value)}
        onKeyDown={(e) => handleKeyDown("d", e)}
        className={`w-6 ${segmentClass}`}
      />
      <span className="select-none text-ink-faint">/</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        maxLength={2}
        placeholder="mm"
        aria-label="Month"
        value={seg.m}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => handleInput("m", e.target.value)}
        onKeyDown={(e) => handleKeyDown("m", e)}
        className={`w-6 ${segmentClass}`}
      />
      <span className="select-none text-ink-faint">/</span>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        maxLength={4}
        placeholder="yyyy"
        aria-label="Year"
        value={seg.y}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => handleInput("y", e.target.value)}
        onKeyDown={(e) => handleKeyDown("y", e)}
        className={`w-11 ${segmentClass}`}
      />

      {name && <input type="hidden" name={name} value={value} />}

      {showCalendar && (
        <>
          <button
            type="button"
            tabIndex={-1}
            onClick={openCalendar}
            aria-label="Open calendar"
            className="ml-auto shrink-0 pl-1 text-ink-faint transition hover:text-ink"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
          {/*
            The real calendar. Kept rendered (not display:none) but visually
            tiny so showPicker() has an anchor to open against; its ISO value
            flows straight through onChange. tabIndex/aria-hidden keep it out of
            the tab order and the a11y tree. [color-scheme:light] keeps the
            popup light in dark theme.
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
    </div>
  );
}
