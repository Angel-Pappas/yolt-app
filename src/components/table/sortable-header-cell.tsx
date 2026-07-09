"use client";

/**
 * A clickable, sortable column header label — shared by every table.
 * Generic over the page's own SortKey union (rather than widened to
 * `string`) so a typo'd sort key is a compile error instead of a
 * silently-dead button.
 */
export function SortableHeaderCell<TSortKey extends string>({
  label,
  sortKey,
  currentSort,
  currentDir,
  align = "left",
  onSort,
}: {
  label: string;
  sortKey: TSortKey;
  currentSort: TSortKey;
  currentDir: "asc" | "desc";
  align?: "left" | "right";
  onSort: (key: TSortKey) => void;
}) {
  const isActive = currentSort === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 transition-colors hover:text-ink-muted ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <span className="text-[9px] text-accent">
          {currentDir === "asc" ? "▲" : "▼"}
        </span>
      )}
    </button>
  );
}
