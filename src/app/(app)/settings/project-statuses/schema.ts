import { z } from "zod";

export const projectStatusSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export type ProjectStatusInput = z.infer<typeof projectStatusSchema>;
