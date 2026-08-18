import { z } from "zod";

export const vatRateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  rate: z.coerce.number().min(0, "Rate must be zero or greater"),
});

export type VatRateInput = z.infer<typeof vatRateSchema>;
