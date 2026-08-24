import { unstable_rethrow } from "next/navigation";

export type ActionResult = { error?: string };

/**
 * Runs a Server Action's body and turns a *thrown* error into a *returned*
 * `{ error }` value.
 *
 * Why this exists: Next.js **sanitizes thrown Server Action errors in
 * production** — the client only ever receives a generic "an error occurred…
 * digest" message, never the real one (a security default). A *returned* value,
 * on the other hand, is passed through intact. So to actually show the user
 * what went wrong (a validation message, a rate limit, a DB constraint, …),
 * the action must catch its own throw and return the message — which is exactly
 * what this does, keeping each action a one-line wrap:
 *
 *   export async function addThing(formData: FormData) {
 *     return formAction(async () => {
 *       // ...existing body that may throw...
 *     });
 *   }
 *
 * `unstable_rethrow` re-throws framework control-flow (`redirect()`,
 * `notFound()`), which work *by* throwing and must not be swallowed here.
 *
 * The dialog form runner (`useFormAction`/`ModalShell`) and `DeleteButton`
 * both display a returned `error`; a returned `{}` (success) behaves exactly as
 * a `void` return did before.
 */
export async function formAction(
  fn: () => Promise<void>
): Promise<ActionResult> {
  try {
    await fn();
    return {};
  } catch (err) {
    unstable_rethrow(err);
    return {
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
}
