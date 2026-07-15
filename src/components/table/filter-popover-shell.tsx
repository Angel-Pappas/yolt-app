"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FunnelIcon } from "@/components/icons";

/** Gap between the trigger and the popover, and the minimum breathing room kept against each viewport edge. */
const OFFSET = 6;
const VIEWPORT_MARGIN = 8;

/**
 * The open/close/positioning/trigger mechanics shared by every header
 * filter popover (categorical, text, number-range, date-range). Each
 * filter type owns only its body (the `children` render prop, closed over
 * a `close()` callback so a filter can dismiss itself after a selection).
 *
 * Built on the native popover attribute (Baseline since April 2025), which
 * buys three things that were previously hand-rolled or simply broken:
 *
 *  1. **It escapes clipping.** This is the whole reason. The popover used
 *     to be an absolutely-positioned div inside each table's
 *     `overflow-x-auto` wrapper, so it was clipped by it — a long options
 *     list (Entities has ~94) got cut off, and on a short table the list
 *     disappeared behind the card's own edge. An `[popover]` element is
 *     promoted to the browser's top layer while open, which is outside
 *     every overflow/transform/stacking context on the page.
 *  2. **Light dismiss and Esc are free**, replacing a manual document
 *     mousedown listener.
 *  3. **Only one `auto` popover stays open at a time**, so opening one
 *     column's filter closes another's, which is what a spreadsheet does.
 *
 * Positioning is done in JS rather than with CSS anchor positioning: the
 * anchor primitives are widely supported now, but `@position-try` (the
 * part that flips a popover that would fall off-screen) still needs a very
 * recent Safari, and flipping is exactly the behavior worth having here.
 * JS `getBoundingClientRect` works everywhere the popover attribute does,
 * so there's no support gap between the two halves of the feature.
 *
 * The popover is right-aligned to its trigger by default, because the
 * trigger always sits at the trailing edge of its column (see
 * TableHeaderCell) — so opening leftward keeps it over the table rather
 * than pushing off the right of the screen. Everything is clamped to the
 * viewport regardless, so no placement can put it out of reach.
 */
export function FilterPopoverShell({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  const position = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const anchor = trigger.getBoundingClientRect();
    const { width, height } = popover.getBoundingClientRect();

    // Prefer below the trigger; flip above only if there genuinely isn't
    // room below AND there is room above (otherwise below + clamped is
    // still the better of two bad options).
    const spaceBelow = window.innerHeight - anchor.bottom - OFFSET - VIEWPORT_MARGIN;
    const spaceAbove = anchor.top - OFFSET - VIEWPORT_MARGIN;
    const flip = height > spaceBelow && spaceAbove > spaceBelow;

    let top = flip ? anchor.top - OFFSET - height : anchor.bottom + OFFSET;
    top = Math.max(
      VIEWPORT_MARGIN,
      Math.min(top, window.innerHeight - height - VIEWPORT_MARGIN)
    );

    let left = anchor.right - width;
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN)
    );

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }, []);

  // Keep React state in sync with the browser's own idea of open/closed —
  // light dismiss and Esc close the popover without going through onClick.
  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    function handleToggle(event: Event) {
      setOpen((event as ToggleEvent).newState === "open");
    }
    popover.addEventListener("toggle", handleToggle);
    return () => popover.removeEventListener("toggle", handleToggle);
  }, []);

  // showPopover() has to happen before measuring (a closed popover is
  // display:none and has no dimensions), and the body has to be rendered
  // before showPopover() — hence a layout effect keyed on `open` rather
  // than positioning inside the click handler.
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const isShown = popover.matches(":popover-open");
    if (open && !isShown) {
      popover.showPopover();
      position();
    } else if (!open && isShown) {
      popover.hidePopover();
    }
  }, [open, position]);

  // The trigger scrolls with the table/page while the popover sits in the
  // top layer and does not, so it has to be re-anchored as things move.
  // Capture phase catches scrolls of any ancestor, not just the window.
  useEffect(() => {
    if (!open) return;
    const reposition = () => position();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, position]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        // popovertarget is deliberately not used: the button drives React
        // state, and the layout effect above owns show/hide so that
        // measuring can happen in the same frame as showing.
        onClick={() => setOpen((o) => !o)}
        aria-label={`Filter by ${label}`}
        aria-expanded={open}
        aria-controls={popoverId}
        className={`rounded p-1 transition-colors ${
          active
            ? "text-accent hover:bg-accent-soft"
            : "text-ink-faint hover:bg-canvas hover:text-ink"
        }`}
      >
        <FunnelIcon className="h-3.5 w-3.5" filled={active} />
      </button>

      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        className="filter-popover"
      >
        {open && (
          // The panel caps its own height and hides its overflow; each
          // filter body decides which part of itself scrolls (the
          // categorical one keeps its search box pinned and scrolls only
          // the options). Chrome lives here rather than on the [popover]
          // element for the same reason the dialogs keep it off <dialog>.
          <div className="flex max-h-[min(22rem,60vh)] w-max min-w-[13rem] max-w-[min(20rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-lg border border-edge bg-surface-raised shadow-[var(--shadow-pop)]">
            {children(() => setOpen(false))}
          </div>
        )}
      </div>
    </>
  );
}
