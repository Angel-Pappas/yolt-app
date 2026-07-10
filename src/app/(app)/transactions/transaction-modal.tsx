"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { AddButton } from "@/components/table/add-button";
import { TransactionFormDialog } from "./transaction-form-dialog";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../lists/vat-rates/vat-rate-queries";
import type { Category } from "../lists/categories/queries";
import type { TransactionType } from "./queries";

type TransactionModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  entities: Entity[];
  categories: Category[];
  wallets: Wallet[];
  vatRates: VatRate[];
  defaultValues?: {
    date: string;
    description: string;
    type: TransactionType;
    net: string;
    entity: { id: string; name: string } | null;
    category: { id: string; name: string } | null;
    wallet_id: string;
    to_wallet_id: string | null;
    vat_rate_id: string | null;
  };
  action: (formData: FormData) => Promise<void>;
};

export function TransactionModal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  submitLabel,
  entities,
  categories,
  wallets,
  vatRates,
  defaultValues,
  action,
}: TransactionModalProps) {
  const { dialogRef, open, close } = useDialog();

  return (
    <>
      <AddButton
        trigger={trigger}
        triggerClassName={triggerClassName}
        triggerLabel={triggerLabel}
        onClick={open}
      />

      <TransactionFormDialog
        dialogRef={dialogRef}
        title={title}
        submitLabel={submitLabel}
        entities={entities}
        categories={categories}
        wallets={wallets}
        vatRates={vatRates}
        defaultValues={defaultValues}
        action={action}
        onDone={close}
      />
    </>
  );
}
