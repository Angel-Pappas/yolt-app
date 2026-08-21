"use client";

import { useRef, useState } from "react";
import { SearchIcon, CloseIcon } from "@/components/icons";
import { useListParams } from "./use-list-params";

/**
 * Debounced search input shared by every list page that wants free-text
 * search (Transactions, Entities, Wallets, a wallet's transaction
 * history — not VAT rates, which is a short, rarely-changed list where a
 * search box would just be clutter).
 *
 * The input needs its own state so it updates instantly on every
 * keystroke while the URL (and the server refetch it triggers) only
 * updates after a debounce. Re-synced from the URL on external changes
 * (e.g. a "Clear filters" button elsewhere on the page) by adjusting
 * state during render — React's recommended alternative to an effect
 * here, since it avoids an extra committed render pass.
 */
export function SearchBox({
  paramKey = "q",
  placeholder,
}: {
  paramKey?: string;
  placeholder: string;
}) {
  const { searchParams, setFilterParams } = useListParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlValue = searchParams.get(paramKey) ?? "";
  const [prevUrlValue, setPrevUrlValue] = useState(urlValue);
  const [inputValue, setInputValue] = useState(urlValue);
  if (urlValue !== prevUrlValue) {
    setPrevUrlValue(urlValue);
    setInputValue(urlValue);
  }

  function handleChange(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setFilterParams({ [paramKey]: value || null }),
      300
    );
  }

  // Clears immediately rather than through the debounce — a clear is a
  // deliberate action, so the list should update at once — and returns focus
  // to the input so the user can keep typing straight away (standard
  // clearable-search behavior). Also fires on Esc while the field has text.
  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue("");
    setFilterParams({ [paramKey]: null });
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-72 min-w-[180px]">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && inputValue) {
            e.preventDefault();
            clearSearch();
          }
        }}
        // Right padding always reserves room for the clear button, so the
        // text never shifts as the button appears/disappears.
        className="w-full rounded-lg border border-edge bg-surface py-2 pr-9 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      {/* Only shown when there's something to clear — an X on an empty field is clutter. */}
      {inputValue && (
        <button
          type="button"
          onClick={clearSearch}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
