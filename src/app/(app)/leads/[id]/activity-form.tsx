"use client";

import { useState, useTransition } from "react";
import { formInputClass } from "@/components/form-styles";
import { addLeadActivity } from "../actions";

/**
 * The "log an action" box on a lead. A thrown Server Action error inside
 * startTransition doesn't surface on its own, so it's caught and shown inline
 * (see the app-wide note on this pattern). Clears the box on success.
 */
export function ActivityForm({ leadId }: { leadId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addLeadActivity(leadId, body);
        setBody("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Log an action — what happened, and the next step…"
        className={formInputClass}
      />
      {error && (
        <p
          className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add entry"}
        </button>
      </div>
    </form>
  );
}
