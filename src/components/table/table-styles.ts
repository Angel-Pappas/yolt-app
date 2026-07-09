/**
 * Single source of truth for how every list/table in the app looks —
 * header row, body row, and header-cell styling. Every table (Transactions,
 * Entities, Wallets, a wallet's transaction history, VAT rates, and any
 * future one) pulls from here instead of repeating these classes, so a
 * future style change only has to happen in this one file.
 */

export const tableHeadRowClass = "border-b border-edge-strong bg-surface-header";

export const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-faint uppercase whitespace-nowrap";

/**
 * `interactive` adds `cursor-pointer` for rows that open an edit dialog on
 * click (the common case). Set it to `false` for a row whose only click
 * target is an inner element (e.g. Wallets, where the name is itself a
 * link and a separate pencil icon opens edit — see wallet-row.tsx).
 */
export function tableRowClass({ interactive = true }: { interactive?: boolean } = {}) {
  return `group border-b border-edge transition-colors last:border-b-0 even:bg-surface-alt hover:bg-canvas${
    interactive ? " cursor-pointer" : ""
  }`;
}
