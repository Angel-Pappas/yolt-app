import { z } from "zod";

// Missing FormData field → "" → null; a present value is trimmed. Lets one
// schema serve both the name-only Add and the full Edit form.
const optionalText = z.preprocess(
  (v) => (v === undefined ? "" : v),
  z.string().trim().transform((s) => s || null)
);

const optionalUuid = z.preprocess(
  (v) => (v === undefined ? "" : v),
  z.union([z.literal(""), z.string().uuid()]).transform((s) => (s === "" ? null : s))
);

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  origin_id: optionalUuid,
  status_id: optionalUuid,
  website: optionalText,
  contact_name: optionalText,
  contact_position: optionalText,
  contact_phone: optionalText,
  contact_landline: optionalText,
  contact_email: optionalText,
  description: optionalText,
  next_step: optionalText,
});
export type LeadInput = z.infer<typeof leadSchema>;

export const leadContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  position: optionalText,
  phone: optionalText,
  landline: optionalText,
  website: optionalText,
  email: optionalText,
});
export type LeadContactInput = z.infer<typeof leadContactSchema>;

export const leadActionSchema = z.object({
  body: z.string().trim().min(1, "Write what happened"),
  // The actor. Only honored server-side when the current user is an admin.
  user_id: optionalUuid,
});
export type LeadActionInput = z.infer<typeof leadActionSchema>;
