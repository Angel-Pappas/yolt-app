"use client";

import { useState, useTransition } from "react";

/**
 * The pending/error/submit state machine every dialog form used to
 * hand-roll itself: run the Server Action in a transition, surface a
 * thrown error inline (a thrown error inside startTransition does *not*
 * reach an Error Boundary — see Summary.md — so this is what makes it
 * visible at all), and close the dialog on success.
 */
export function useFormAction(
  action: (formData: FormData) => Promise<void>,
  onDone: () => void
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        setError(null);
        await action(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return { handleSubmit, isPending, error };
}
