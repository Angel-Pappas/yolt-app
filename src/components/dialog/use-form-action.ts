"use client";

import { useState, useTransition } from "react";

/**
 * The pending/error/submit state machine every dialog form used to
 * hand-roll itself: run the Server Action in a transition, surface a
 * thrown error inline (a thrown error inside startTransition does *not*
 * reach an Error Boundary — see Summary.md — so this is what makes it
 * visible at all), and close the dialog on success.
 *
 * An action may also *return* `{ error }` instead of throwing — preferred
 * whenever the message is meant for the user, because Next.js sanitizes
 * *thrown* Server Action errors in production (the message becomes a
 * generic "an error occurred… digest"), whereas a returned value survives
 * intact. A returned error keeps the dialog open and shows the message.
 */
export function useFormAction(
  action: (formData: FormData) => Promise<void | { error?: string | null }>,
  onDone: () => void
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        setError(null);
        const result = await action(formData);
        if (result && result.error) {
          setError(result.error);
          return;
        }
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return { handleSubmit, isPending, error };
}
