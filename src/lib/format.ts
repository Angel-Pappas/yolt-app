/**
 * Expects an ISO "yyyy-mm-dd" string (what Postgres `date` columns return
 * via Supabase) and renders it Greek-style: dd/mm/yyyy.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * "dd/mm/yyyy" (what the user types into a `DateField`) -> ISO "yyyy-mm-dd",
 * or "" if it isn't a real calendar date. Strict on purpose: leading zeros
 * are optional on input, but impossible dates (month > 12, 31/04, 29/02 in a
 * non-leap year) are rejected by round-tripping through a Date, so the ISO
 * value handed to a form or URL param is always either a genuine date or
 * empty — never a plausible-looking lie.
 */
export function displayToIso(display: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(display.trim());
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
 * Strips anything that isn't a digit or a decimal separator from a typed
 * amount, so the field accepts a Greek "," as readily as "." but rejects stray
 * letters. Used by the amount inputs, which are plain text (not
 * `<input type="number">`, whose accepted decimal separator Chrome ties to the
 * OS/browser locale — a Greek locale then can't type ".", and often not "," either).
 */
export function sanitizeAmountInput(value: string): string {
  return value.replace(/[^\d.,]/g, "");
}

/**
 * Parses a typed amount that may use "," or "." as the decimal separator
 * (Greek keyboards produce ",") into a finite number. With a comma present it
 * is the decimal point and any "." are thousands separators (dropped); without
 * a comma, "." is the decimal point. Empty or unparseable input is 0. This is
 * the one place amount strings become numbers — use it wherever a typed amount
 * is read for maths or submission.
 */
export function parseAmountInput(value: string): number {
  const s = value.trim();
  if (s === "") return 0;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
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
 * Formats a Date as "yyyy-mm-dd" in the browser's LOCAL timezone. Deliberately
 * not `date.toISOString().slice(0, 10)` — that converts to UTC first, which
 * lands on the wrong day for part of the day in any timezone ahead of UTC
 * (e.g. Greece), since local midnight is still "yesterday" in UTC. This is the
 * single source of truth for turning a Date into the ISO string our `date`
 * columns and `<input type="date">` values use — don't re-implement it locally.
 */
export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date as "yyyy-mm-dd" in the browser's local timezone. */
export function todayLocalIsoDate(): string {
  return toLocalIsoDate(new Date());
}
