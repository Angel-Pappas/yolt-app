"use client";

import { useRef, useState } from "react";
import { useListParams } from "./use-list-params";

/**
 * One URL search param, debounced the same way SearchBox debounces `q` —
 * local state updates instantly on every keystroke while the URL (and the
 * server refetch it triggers) only updates 300ms after the last change.
 * Re-synced from the URL on external changes (e.g. "Clear filters") by
 * adjusting state during render, same pattern as SearchBox.
 */
export function useDebouncedParam(paramKey: string) {
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

  return { urlValue, inputValue, handleChange };
}
