/**
 * Single source of truth for how a plain text/number/select input and its
 * label look — used by every dialog form (via ModalShell's children) and
 * every plain-form page (Options, Account, Login, Signup) alike, instead
 * of each one repeating the same Tailwind string.
 */
export const formInputClass =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export const formLabelClass = "mb-1 block text-sm text-ink-muted";

/**
 * A primary submit button outside of ModalShell's own (which is
 * identical plus `disabled:opacity-50` — ModalShell always has a
 * pending state to disable against, a plain page form like Account's
 * doesn't). Also matches AddButton's default styling.
 */
export const formPrimaryButtonClass =
  "inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px";
