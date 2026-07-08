/** Converts a FormData into a plain string record, ready for a zod schema's safeParse. Non-string entries (file inputs) are dropped — none of this app's forms use them. */
export function formDataToRecord(formData: FormData): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      record[key] = value;
    }
  }
  return record;
}
