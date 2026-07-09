"use client";

import { PlusIcon } from "@/components/icons";

/**
 * The "+ Add" trigger button shared by every list page's add-modal
 * (TransactionModal, EntityModal, WalletModal, VatRateModal) — each of
 * those still owns its own dialog, this is just the button that opens it.
 */
export function AddButton({
  trigger,
  triggerClassName,
  triggerLabel,
  onClick,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={triggerLabel}
      className={
        triggerClassName ??
        "inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px"
      }
    >
      <PlusIcon className="h-3.5 w-3.5" />
      {trigger}
    </button>
  );
}
