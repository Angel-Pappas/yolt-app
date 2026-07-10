"use client";

import { useId, useMemo, useRef, useState } from "react";
import { formatAmount } from "@/lib/format";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import { addEntity } from "../entities/actions";
import { EntityFormDialog } from "../entities/entity-form-dialog";
import type { Entity } from "../entities/queries";
import type { Wallet } from "../wallets/queries";
import type { VatRate } from "../lists/vat-rates/vat-rate-queries";
import { addCategory } from "../lists/categories/actions";
import { CategoryFormDialog } from "../lists/categories/category-form-dialog";
import type { Category } from "../lists/categories/queries";
import type { TransactionType } from "./queries";
import { EntityCombobox } from "./entity-combobox";
import { CategoryCombobox } from "./category-combobox";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

type TransactionFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
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
  onDone: () => void;
};

export function TransactionFormDialog({
  dialogRef,
  title,
  submitLabel,
  entities,
  categories,
  wallets,
  vatRates,
  defaultValues,
  action,
  onDone,
}: TransactionFormDialogProps) {
  const uid = useId();
  // Rendered as siblings of the main <form> below (not nested inside it) —
  // a <form> can't validly contain another <form>, and the add-entity/
  // add-category dialogs each have their own.
  const addEntityDialogRef = useRef<HTMLDialogElement>(null);
  const addCategoryDialogRef = useRef<HTMLDialogElement>(null);

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

  return (
    <ModalShell
      dialogRef={dialogRef}
      title={title}
      submitLabel={submitLabel}
      action={action}
      onDone={onDone}
      submitDisabled={
        wallets.length === 0 ||
        Boolean(sameWalletError) ||
        (!isTransfer && vatRates.length === 0)
      }
      dialogChildren={
        <>
          <EntityFormDialog
            dialogRef={addEntityDialogRef}
            title="Add entity"
            submitLabel="Add"
            action={addEntity}
            onDone={() => addEntityDialogRef.current?.close()}
          />
          <CategoryFormDialog
            dialogRef={addCategoryDialogRef}
            title="Add category"
            submitLabel="Add"
            defaultValues={{ name: "", type: type === "transfer" ? "expense" : type }}
            action={addCategory}
            onDone={() => addCategoryDialogRef.current?.close()}
          />
        </>
      }
    >
      <div>
        <label className={formLabelClass}>Type</label>
        <div
          role="radiogroup"
          aria-label="Type"
          className="inline-flex w-full gap-1 rounded-lg border border-edge bg-canvas p-1"
        >
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={type === opt.value}
              onClick={() => setType(opt.value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                type === opt.value
                  ? "bg-surface-raised text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      <div>
        <label htmlFor={`${uid}-date`} className={formLabelClass}>
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
          className={`${formInputClass} [color-scheme:light]`}
        />
      </div>

      {!isTransfer && (
        <EntityCombobox
          entities={entities}
          defaultValue={defaultValues?.entity ?? null}
          onAddNew={() => addEntityDialogRef.current?.showModal()}
        />
      )}

      {!isTransfer && (
        <CategoryCombobox
          categories={categories}
          type={type}
          defaultValue={defaultValues?.category ?? null}
          onAddNew={() => addCategoryDialogRef.current?.showModal()}
        />
      )}

      {isTransfer ? (
        <>
          <div>
            <label htmlFor={`${uid}-from-wallet`} className={formLabelClass}>
              From wallet
            </label>
            <select
              id={`${uid}-from-wallet`}
              name="wallet_id"
              required
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className={formInputClass}
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
            <label htmlFor={`${uid}-to-wallet`} className={formLabelClass}>
              To wallet
            </label>
            <select
              id={`${uid}-to-wallet`}
              name="to_wallet_id"
              required
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className={formInputClass}
            >
              <option value="">—</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {sameWalletError && (
              <p className="mt-1 text-xs text-expense">
                From and to wallet must be different.
              </p>
            )}
          </div>
        </>
      ) : (
        <div>
          <label htmlFor={`${uid}-wallet`} className={formLabelClass}>
            Wallet
          </label>
          <select
            id={`${uid}-wallet`}
            name="wallet_id"
            required
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className={formInputClass}
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
        <label htmlFor={`${uid}-description`} className={formLabelClass}>
          Description
        </label>
        <input
          id={`${uid}-description`}
          name="description"
          type="text"
          required
          defaultValue={defaultValues?.description}
          className={formInputClass}
        />
      </div>

      <div>
        <label htmlFor={`${uid}-net`} className={formLabelClass}>
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
          className={formInputClass}
        />
      </div>

      {!isTransfer && (
        <div>
          <label htmlFor={`${uid}-vat`} className={formLabelClass}>
            VAT
          </label>
          <select
            id={`${uid}-vat`}
            name="vat_rate_id"
            required
            value={vatRateId}
            onChange={(e) => setVatRateId(e.target.value)}
            className={formInputClass}
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
            <p className="mt-1 text-xs text-ink-faint">
              Add a VAT rate in Options before creating a transaction.
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5 rounded-lg bg-canvas p-3">
        {!isTransfer && (
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">VAT amount</span>
            <span className="tabular-nums text-ink">{formatAmount(vatAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-ink">Total</span>
          <span className="tabular-nums text-ink">{formatAmount(total)}</span>
        </div>
      </div>
    </ModalShell>
  );
}
