"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { formatAmount } from "@/lib/format";
import { addEntity } from "../entities/actions";
import { EntityFormDialog } from "../entities/entity-form-dialog";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../options/vat-rate-queries";
import type { TransactionType } from "./queries";
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
    type: TransactionType;
    net: string;
    entity: { id: string; name: string } | null;
    wallet_id: string;
    to_wallet_id: string | null;
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
  const [error, setError] = useState<string | null>(null);
  // Rendered as a sibling of the main <form> below (not nested inside it) —
  // a <form> can't validly contain another <form>, and the add-entity
  // dialog has its own.
  const addEntityDialogRef = useRef<HTMLDialogElement>(null);

  const [type, setType] = useState<TransactionType>(
    defaultValues?.type ?? "income"
  );
  const [net, setNet] = useState(defaultValues?.net ?? "");
  const [vatRateId, setVatRateId] = useState(
    defaultValues?.vat_rate_id ?? vatRates[0]?.id ?? ""
  );
  const [walletId, setWalletId] = useState(
    defaultValues?.wallet_id ?? wallets[0]?.id ?? ""
  );
  const [toWalletId, setToWalletId] = useState(
    defaultValues?.to_wallet_id ?? ""
  );

  const isTransfer = type === "transfer";

  const selectedRate = useMemo(
    () => vatRates.find((v) => v.id === vatRateId),
    [vatRates, vatRateId]
  );
  const vatAmount = useMemo(() => {
    if (isTransfer || !selectedRate || !net) return 0;
    return (Number(net) * Number(selectedRate.rate)) / 100;
  }, [isTransfer, net, selectedRate]);
  const total = Number(net || 0) + vatAmount;

  const sameWalletError =
    isTransfer && walletId && toWalletId && walletId === toWalletId;

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

  // A click that lands exactly on the <dialog> element itself (not a
  // descendant) is a click on the backdrop — close on that, same as Esc.
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) {
      onDone();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={onDone}
      className="w-full max-w-sm bg-transparent [&::backdrop]:bg-black/40"
    >
      <form
        action={handleSubmit}
        className="space-y-3 rounded border bg-white p-6"
      >
        <h2 className="text-lg font-semibold">{title}</h2>

        <div>
          <label htmlFor={`${uid}-type`} className="block text-sm">
            Type
          </label>
          <select
            id={`${uid}-type`}
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="w-full rounded border px-2 py-1"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

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

        {!isTransfer && (
          <EntityCombobox
            entities={entities}
            defaultValue={defaultValues?.entity ?? null}
            onAddNew={() => addEntityDialogRef.current?.showModal()}
          />
        )}

        {isTransfer ? (
          <>
            <div>
              <label htmlFor={`${uid}-from-wallet`} className="block text-sm">
                From wallet
              </label>
              <select
                id={`${uid}-from-wallet`}
                name="wallet_id"
                required
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full rounded border px-2 py-1"
              >
                {wallets.length === 0 && <option value="">No wallets</option>}
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`${uid}-to-wallet`} className="block text-sm">
                To wallet
              </label>
              <select
                id={`${uid}-to-wallet`}
                name="to_wallet_id"
                required
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full rounded border px-2 py-1"
              >
                <option value="">—</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {sameWalletError && (
                <p className="mt-1 text-xs text-red-600">
                  From and to wallet must be different.
                </p>
              )}
            </div>
          </>
        ) : (
          <div>
            <label htmlFor={`${uid}-wallet`} className="block text-sm">
              Wallet
            </label>
            <select
              id={`${uid}-wallet`}
              name="wallet_id"
              required
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full rounded border px-2 py-1"
            >
              {wallets.length === 0 && <option value="">No wallets</option>}
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
            {isTransfer ? "Amount" : "Net"}
          </label>
          <input
            id={`${uid}-net`}
            name="net"
            type="number"
            step="0.01"
            min="0"
            required
            value={net}
            onChange={(e) => setNet(e.target.value)}
            className="w-full rounded border px-2 py-1"
          />
        </div>

        {!isTransfer && (
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
        )}

        {!isTransfer && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">VAT amount</span>
            <span>{formatAmount(vatAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{formatAmount(total)}</span>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

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
            disabled={
              isPending ||
              wallets.length === 0 ||
              Boolean(sameWalletError) ||
              (!isTransfer && vatRates.length === 0)
            }
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
