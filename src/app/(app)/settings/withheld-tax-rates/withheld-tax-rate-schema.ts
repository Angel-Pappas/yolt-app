import { z } from "zod";

export const withheldTaxRateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  rate: z.coerce.number().min(0, "Rate must be zero or greater"),
});

export type WithheldTaxRateInput = z.infer<typeof withheldTaxRateSchema>;
