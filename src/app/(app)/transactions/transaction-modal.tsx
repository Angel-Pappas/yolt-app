"use client";

import { useState } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { TransactionFormDialog, type TransactionSeed } from "./transaction-form-dialog";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../lists/vat-rates/vat-rate-queries";
import type { Category } from "../lists/categories/queries";

type TransactionModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  entities: Entity[];
  categories: Category[];
  wallets: Wallet[];
  vatRates: VatRate[];
  action: (formData: FormData) => Promise<void>;
};

/**
 * The Add-transaction trigger + dialog. Owns a `generation` counter that's
 * bumped after every successful add — the dialog is remounted (via `key`)
 * with a fresh seed each time, which is what actually resets the
 * comboboxes/inputs' internal state rather than leaving the previous
 * transaction's values sitting in fields the user didn't touch. Three
 * outcomes, one per footer button in transaction-form-dialog.tsx:
 *  - Add: reset to true defaults, close.
 *  - Add + New: reset to true defaults, stay open.
 *  - Add + Same: reseed with everything but the amount, stay open.
 */
export function TransactionModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  entities,
  categories,
  wallets,
  vatRates,
  action,
}: TransactionModalProps) {
  const { dialogRef, open, close } = useDialog();
  const [generation, setGeneration] = useState(0);
  const [seed, setSeed] = useState<TransactionSeed | undefined>(undefined);
  const [autoOpen, setAutoOpen] = useState(false);

  function resetAndClose() {
    setSeed(undefined);
    setAutoOpen(false);
    setGeneration((g) => g + 1);
    close();
  }

  function resetAndKeepOpen() {
    setSeed(undefined);
    setAutoOpen(true);
    setGeneration((g) => g + 1);
  }

  function reseedSame(next: TransactionSeed) {
    setSeed(next);
    setAutoOpen(true);
    setGeneration((g) => g + 1);
  }

  return (
    <>
      <AddButton
        trigger={trigger}
        triggerClassName={triggerClassName}
        triggerLabel={triggerLabel}
        onClick={open}
      />

      <TransactionFormDialog
        key={generation}
        dialogRef={dialogRef}
        title={title}
        entities={entities}
        categories={categories}
        wallets={wallets}
        vatRates={vatRates}
        defaultValues={seed}
        autoOpen={autoOpen}
        action={action}
        onDone={resetAndClose}
        addVariants={{
          onAddClose: resetAndClose,
          onAddNew: resetAndKeepOpen,
          onAddSame: reseedSame,
        }}
      />
    </>
  );
}
