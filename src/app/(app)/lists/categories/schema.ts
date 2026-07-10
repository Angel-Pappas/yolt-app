import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
});

export type CategoryInput = z.infer<typeof categorySchema>;
