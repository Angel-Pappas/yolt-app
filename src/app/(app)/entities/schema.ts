import { z } from "zod";

export const entitySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  vat_number: z
    .string()
    .trim()
    .transform((v) => v || null),
});

export type EntityInput = z.infer<typeof entitySchema>;
