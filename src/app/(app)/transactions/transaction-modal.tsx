"use client";

import { useRef } from "react";
import { AddButton } from "@/components/table/add-button";
import { TransactionFormDialog } from "./transaction-form-dialog";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../options/vat-rate-queries";
import type { TransactionType } from "./queries";

type TransactionModalProps = {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  submitLabel: string;
  entities: Entity[];
  wallets: Wallet[];
  vatRates: VatRate[];
  defaultValues?: {
    date: string;
    description: string;
    type: TransactionType;
    net: string;
    entity: { id: string; name: string } | null;
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
  wallets,
  vatRates,
  defaultValues,
  action,
}: TransactionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  return (
    <>
      <AddButton
        trigger={trigger}
        triggerClassName={triggerClassName}
        triggerLabel={triggerLabel}
        onClick={openModal}
      />

      <TransactionFormDialog
        dialogRef={dialogRef}
        title={title}
        submitLabel={submitLabel}
        entities={entities}
        wallets={wallets}
        vatRates={vatRates}
        defaultValues={defaultValues}
        action={action}
        onDone={closeModal}
      />
    </>
  );
}
