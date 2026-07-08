import type { z } from "zod";

/** Parses `data` against `schema`, throwing a clean, user-facing message (the first validation issue) on failure instead of ever passing unvalidated input to Supabase. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid input");
  }
  return result.data;
}
