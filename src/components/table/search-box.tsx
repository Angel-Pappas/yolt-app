"use client";

import { useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
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

  return (
    <div className="relative min-w-[180px] flex-1 basis-56">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border border-edge bg-surface py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}
