/**
 * Expects an ISO "yyyy-mm-dd" string (what Postgres `date` columns return
 * via Supabase) and renders it Greek-style: dd/mm/yyyy.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Greek-style number formatting: "." for thousands, "," for decimals,
 * always rounded to exactly 2 decimal places.
 */
export function formatAmount(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
  const isNegative = rounded < 0;
  const [intPart, decPart = "00"] = Math.abs(rounded).toFixed(2).split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${isNegative ? "-" : ""}${withThousands},${decPart}`;
}
