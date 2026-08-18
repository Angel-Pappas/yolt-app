import { z } from "zod";

export const leadStatusSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export type LeadStatusInput = z.infer<typeof leadStatusSchema>;
