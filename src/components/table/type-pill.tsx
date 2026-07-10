/**
 * The rounded pill-with-a-dot used for any categorical status column
 * (Transactions' Type, Categories' Type, and any future one) — callers
 * keep their own label/color mapping (the domain-specific part), this is
 * just the shared markup, extracted after Categories needed a second,
 * near-identical copy of what transaction-row.tsx already had inline.
 */
export function TypePill({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${colorClass}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "currentColor" }}
      />
      {label}
    </span>
  );
}
