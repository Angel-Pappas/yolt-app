"use client";

/** The "Clear filters" text link shared by any list page's toolbar. */
export function ClearFiltersLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-auto text-xs text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-expense"
    >
      Clear filters
    </button>
  );
}
