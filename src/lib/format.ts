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

/**
 * Total is never stored — it's always net + vat_amount, computed wherever
 * it's displayed so it can never drift from its inputs.
 */
export function computeTotal(net: number | string, vatAmount: number | string): number {
  return Number(net) + Number(vatAmount);
}

/** Rounds to exactly 2 decimals, avoiding float artifacts like 0.1 + 0.2. Shared by the transaction form's client-side net/total math and the server's VAT computation, so both round the same way. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Expects a "yyyy-mm" tax-period key (see taxes/queries.ts) and renders e.g. "July 2026". */
export function formatMonthYear(period: string): string {
  const [year, month] = period.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

/**
 * Today's date as "yyyy-mm-dd" in the browser's local timezone. Deliberately
 * not `new Date().toISOString().slice(0, 10)` — that converts to UTC first,
 * which lands on the wrong day for part of the day in any timezone ahead of
 * UTC (e.g. Greece), since local midnight is still "yesterday" in UTC.
 */
export function todayLocalIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
