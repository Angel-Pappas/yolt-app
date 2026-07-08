"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { formatAmount } from "@/lib/format";
import { addEntity } from "../entities/actions";
import { EntityFormDialog } from "../entities/entity-form-dialog";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../options/vat-rate-queries";
import { EntityCombobox } from "./entity-combobox";

type TransactionFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  entities: Entity[];
  wallets: Wallet[];
  vatRates: VatRate[];
  defaultValues?: {
    date: string;
    description: string;
    net: string;
    entity: { id: string; name: string } | null;
    wallet_id: string | null;
    vat_rate_id: string | null;
  };
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
};

export function TransactionFormDialog({
  dialogRef,
  title,
  submitLabel,
  entities,
  wallets,
  vatRates,
  defaultValues,
  action,
  onDone,
}: TransactionFormDialogProps) {
  const uid = useId();
  const [isPending, startTransition] = useTransition();
  // Rendered as a sibling of the main <form> below (not nested inside it) —
  // a <form> can't validly contain another <form>, and the add-entity
  // dialog has its own.
  const addEntityDialogRef = useRef<HTMLDialogElement>(null);

  const [net, setNet] = useState(defaultValues?.net ?? "");
  const [vatRateId, setVatRateId] = useState(
    defaultValues?.vat_rate_id ?? vatRates[0]?.id ?? ""
  );

  const selectedRate = useMemo(
    () => vatRates.find((v) => v.id === vatRateId),
    [vatRates, vatRateId]
  );
  const vatAmount = useMemo(() => {
    if (!selectedRate || !net) return 0;
    return (Number(net) * Number(selectedRate.rate)) / 100;
  }, [net, selectedRate]);
  const total = Number(net || 0) + vatAmount;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      onDone();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => e.stopPropagation()}
      onCancel={onDone}
      className="w-full max-w-sm rounded border p-6 [&::backdrop]:bg-black/40"
    >
      <form action={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>

        <div>
          <label htmlFor={`${uid}-date`} className="block text-sm">
            Date
          </label>
          <input
            id={`${uid}-date`}
            name="date"
            type="date"
            required
            defaultValue={
              defaultValues?.date ?? new Date().toISOString().slice(0, 10)
            }
            className="w-full rounded border px-2 py-1"
          />
        </div>

        <EntityCombobox
          entities={entities}
          defaultValue={defaultValues?.entity ?? null}
          onAddNew={() => addEntityDialogRef.current?.showModal()}
        />

        <div>
          <label htmlFor={`${uid}-wallet`} className="block text-sm">
            Wallet
          </label>
          <select
            id={`${uid}-wallet`}
            name="wallet_id"
            defaultValue={defaultValues?.wallet_id ?? ""}
            className="w-full rounded border px-2 py-1"
          >
            <option value="">—</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${uid}-description`} className="block text-sm">
            Description
          </label>
          <input
            id={`${uid}-description`}
            name="description"
            type="text"
            required
            defaultValue={defaultValues?.description}
            className="w-full rounded border px-2 py-1"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-net`} className="block text-sm">
            Net
          </label>
          <input
            id={`${uid}-net`}
            name="net"
            type="number"
            step="0.01"
            required
            value={net}
            onChange={(e) => setNet(e.target.value)}
            className="w-full rounded border px-2 py-1"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-vat`} className="block text-sm">
            VAT
          </label>
          <select
            id={`${uid}-vat`}
            name="vat_rate_id"
            required
            value={vatRateId}
            onChange={(e) => setVatRateId(e.target.value)}
            className="w-full rounded border px-2 py-1"
          >
            {vatRates.length === 0 && (
              <option value="">No VAT rates configured</option>
            )}
            {vatRates.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.rate}%)
              </option>
            ))}
          </select>
          {vatRates.length === 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              Add a VAT rate in Options before creating a transaction.
            </p>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">VAT amount</span>
          <span>{formatAmount(vatAmount)}</span>
        </div>

        <div className="flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{formatAmount(total)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onDone}
            className="rounded px-3 py-1.5 text-sm underline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || vatRates.length === 0}
            className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {isPending ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>

      <EntityFormDialog
        dialogRef={addEntityDialogRef}
        title="Add entity"
        submitLabel="Add"
        action={addEntity}
        onDone={() => addEntityDialogRef.current?.close()}
      />
    </dialog>
  );
}
