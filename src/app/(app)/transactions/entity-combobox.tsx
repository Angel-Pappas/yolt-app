"use client";

import { useId, useMemo, useState } from "react";
import type { Entity } from "../entities/queries";

type EntityComboboxProps = {
  entities: Entity[];
  defaultValue?: { id: string; name: string } | null;
  onAddNew: () => void;
};

/**
 * Client-side filtered search over an already-loaded entity list (this
 * app is single-user with a small entity count, so no server round-trip
 * is needed per keystroke). Selecting an entity fills a hidden
 * `entity_id` input for the enclosing form to submit.
 */
export function EntityCombobox({
  entities,
  defaultValue,
  onAddNew,
}: EntityComboboxProps) {
  const uid = useId();
  const [query, setQuery] = useState(defaultValue?.name ?? "");
  const [selectedId, setSelectedId] = useState(defaultValue?.id ?? "");
  const [isOpen, setIsOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? entities.filter((e) => e.name.toLowerCase().includes(q))
      : entities;
    return list.slice(0, 20);
  }, [entities, query]);

  function selectEntity(entity: Entity) {
    setSelectedId(entity.id);
    setQuery(entity.name);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor={`${uid}-entity`} className="mb-1 block text-sm text-ink-muted">
        Entity
      </label>
      <div className="flex gap-2">
        <input
          id={`${uid}-entity`}
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
          placeholder="Search entities…"
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
      <input type="hidden" name="entity_id" value={selectedId} />

      {isOpen && matches.length > 0 && (
        <ul className="absolute z-10 mt-1.5 max-h-48 w-full overflow-auto rounded-lg border border-edge bg-surface-raised p-1 text-sm shadow-[var(--shadow-pop)]">
          {matches.map((entity) => (
            <li key={entity.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectEntity(entity)}
                className="block w-full rounded-md px-2.5 py-1.5 text-left text-ink hover:bg-canvas"
              >
                {entity.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
