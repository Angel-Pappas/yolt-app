import { z } from "zod";
import { parseAmountInput } from "@/lib/format";

// Missing FormData field → "" → null; a present value is trimmed. Lets one
// schema serve both the Add modal and the Edit page.
const optionalText = z.preprocess(
  (v) => (v === undefined ? "" : v),
  z.string().trim().transform((s) => s || null)
);

const optionalUuid = z.preprocess(
  (v) => (v === undefined ? "" : v),
  z.union([z.literal(""), z.string().uuid()]).transform((s) => (s === "" ? null : s))
);

// A money field: blank → null (no value yet); otherwise parsed via the same
// "," / "." aware helper the transaction amount uses.
const optionalAmount = z.preprocess((v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  return parseAmountInput(s);
}, z.number().min(0, "Value can't be negative").nullable());

// Whole months, blank → null.
const optionalMonths = z.preprocess((v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}, z.number().int("Months must be a whole number").min(0, "Months can't be negative").nullable());

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  status_id: optionalUuid,
  value: optionalAmount,
  estimated_months: optionalMonths,
  description: optionalText,
  next_step: optionalText,
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const projectActionSchema = z.object({
  body: z.string().trim().min(1, "Write what happened"),
  action_date: z.iso.date("Invalid date"),
  // The actor. Only honored server-side when the current user is an admin.
  user_id: optionalUuid,
});
export type ProjectActionInput = z.infer<typeof projectActionSchema>;

// The lead → project conversion prompt: just the new project's name.
export const convertLeadSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
});
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
