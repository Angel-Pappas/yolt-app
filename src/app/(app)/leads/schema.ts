import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null);

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: optionalText,
  email: optionalText,
  needs: optionalText,
  description: optionalText,
  // "" (no status picked) → null; otherwise must be a uuid.
  status_id: z
    .union([z.literal(""), z.string().uuid()])
    .transform((v) => (v === "" ? null : v)),
});

export type LeadInput = z.infer<typeof leadSchema>;
