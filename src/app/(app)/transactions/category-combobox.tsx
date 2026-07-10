"use client";

import { useId, useMemo, useState } from "react";
import type { Category, CategoryType } from "../lists/categories/queries";

type CategoryComboboxProps = {
  categories: Category[];
  type: CategoryType;
  defaultValue?: { id: string; name: string } | null;
  onAddNew: () => void;
};

/**
 * Client-side filtered search over the already-loaded category list —
 * same shape as entity-combobox.tsx — narrowed to just the categories
 * matching the form's current income/expense type, since an "income"
 * category never makes sense on an expense row (and vice versa).
 *
 * If the user flips the transaction's Type after picking a category, the
 * selection is cleared rather than silently carried over to the new
 * type — adjusted directly in the render body (comparing against the
 * previous `type` prop) rather than a useEffect, same pattern already
 * used by search-box.tsx for resyncing from an external value change.
 */
export function CategoryCombobox({
  categories,
  type,
  defaultValue,
  onAddNew,
}: CategoryComboboxProps) {
  const uid = useId();
  const [prevType, setPrevType] = useState(type);
  const [query, setQuery] = useState(defaultValue?.name ?? "");
  const [selectedId, setSelectedId] = useState(defaultValue?.id ?? "");
  const [isOpen, setIsOpen] = useState(false);

  if (type !== prevType) {
    setPrevType(type);
    setQuery("");
    setSelectedId("");
  }

  const typeCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? typeCategories.filter((c) => c.name.toLowerCase().includes(q))
      : typeCategories;
    return list.slice(0, 20);
  }, [typeCategories, query]);

  function selectCategory(category: Category) {
    setSelectedId(category.id);
    setQuery(category.name);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor={`${uid}-category`} className="mb-1 block text-sm text-ink-muted">
        Category
      </label>
      <div className="flex gap-2">
        <input
          id={`${uid}-category`}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId("");
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          autoComplete="off"
          placeholder="Search categories…"
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center whitespace-nowrap rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-edge-strong hover:text-ink"
        >
          + Add
        </button>
      </div>
      <input type="hidden" name="category_id" value={selectedId} />

      {isOpen && matches.length > 0 && (
        <ul className="absolute z-10 mt-1.5 max-h-48 w-full overflow-auto rounded-lg border border-edge bg-surface-raised p-1 text-sm shadow-[var(--shadow-pop)]">
          {matches.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCategory(category)}
                className="block w-full rounded-md px-2.5 py-1.5 text-left text-ink hover:bg-canvas"
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
