"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { formatAmount, round2 } from "@/lib/format";
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

const AMOUNT_MODE_OPTIONS = [
  { value: "net", label: "Net" },
  { value: "total", label: "Total" },
] as const;

export type AmountMode = (typeof AMOUNT_MODE_OPTIONS)[number]["value"];

/** The full set of field values a fresh Add-transaction dialog can be seeded with — either "true defaults" (undefined) or carried over from a just-added transaction ("Add + Same", see transaction-modal.tsx). */
export type TransactionSeed = {
  date: string;
  invoice_date: string;
  description: string;
  type: TransactionType;
  net: string;
  entity: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  wallet_id: string;
  to_wallet_id: string | null;
  vat_rate_id: string | null;
  amountMode?: AmountMode;
};

export type AddVariantHandlers = {
  /** Plain "Add" — transaction saved, dialog closes, next open starts fresh. */
  onAddClose: () => void;
  /** "Add + Same" — transaction saved, dialog stays open pre-filled with everything except the amount. */
  onAddSame: (seed: TransactionSeed) => void;
  /** "Add + New" — transaction saved, dialog stays open reset to true defaults. */
  onAddNew: () => void;
};

/** "Alpha Bank"/24% are this user's everyday defaults (see Directions from the user) — matched by name/rate rather than a hardcoded id so a future re-seed of either row doesn't silently break the default. */
function defaultWalletId(wallets: Wallet[]): string {
  const alpha = wallets.find((w) => w.name.trim().toLowerCase() === "alpha bank");
  return alpha?.id ?? wallets[0]?.id ?? "";
}

function defaultVatRateId(vatRates: VatRate[]): string {
  const twentyFour = vatRates.find((v) => Number(v.rate) === 24);
  return twentyFour?.id ?? vatRates[0]?.id ?? "";
}

type TransactionFormDialogProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel?: string;
  entities: Entity[];
  categories: Category[];
  wallets: Wallet[];
  vatRates: VatRate[];
  defaultValues?: TransactionSeed;
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
  /** Present only for the Add-transaction flow — swaps the single Save button for Cancel / Add + New / Add + Same / Add. See transaction-modal.tsx. */
  addVariants?: AddVariantHandlers;
  /** Auto-opens right after mount — used when Add + Same/New remounts this component (a fresh `key`) while the dialog is expected to stay open. */
  autoOpen?: boolean;
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
  addVariants,
  autoOpen = false,
}: TransactionFormDialogProps) {
  const uid = useId();
  // Rendered as siblings of the main <form> below (not nested inside it) —
  // a <form> can't validly contain another <form>, and the add-entity/
  // add-category dialogs each have their own.
  const addEntityDialogRef = useRef<HTMLDialogElement>(null);
  const addCategoryDialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    if (autoOpen) {
      dialogRef.current?.showModal();
    }
    // autoOpen is fixed for the lifetime of a given mount (a new value only
    // ever takes effect via the parent remounting this component with a
    // fresh key) — this is deliberately mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const [type, setType] = useState<TransactionType>(defaultValues?.type ?? "expense");
  const [date, setDate] = useState(
    defaultValues?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [invoiceDate, setInvoiceDate] = useState(
    defaultValues?.invoice_date ?? date
  );
  // Once the user edits Invoice date directly, it stops following Date —
  // preserved across an edit re-open by checking whether the saved values
  // already diverged, so an existing deliberate divergence doesn't get
  // silently re-synced just because Date is touched again in this session.
  const [invoiceDateTouched, setInvoiceDateTouched] = useState(
    defaultValues ? defaultValues.invoice_date !== defaultValues.date : false
  );
  const [amountMode, setAmountMode] = useState<AmountMode>(
    defaultValues?.amountMode ?? "net"
  );
  const [amountInput, setAmountInput] = useState(defaultValues?.net ?? "");
  const [vatRateId, setVatRateId] = useState(
    defaultValues?.vat_rate_id ?? defaultVatRateId(vatRates)
  );
  const [walletId, setWalletId] = useState(
    defaultValues?.wallet_id ?? defaultWalletId(wallets)
  );
  const [toWalletId, setToWalletId] = useState(
    defaultValues?.to_wallet_id ?? ""
  );

  const isTransfer = type === "transfer";

  const selectedRate = useMemo(
    () => vatRates.find((v) => v.id === vatRateId),
    [vatRates, vatRateId]
  );
  const rate = selectedRate ? Number(selectedRate.rate) : 0;
  const amountNum = Number(amountInput || 0);

  // Net is always the value actually saved — in "total" mode it's derived
  // by removing the tax, in "net" mode it's exactly what was typed. VAT
  // amount is then always net × rate, same formula the server uses to
  // (re)compute it at save time, so the two never disagree.
  const netValue = isTransfer
    ? amountNum
    : amountMode === "net"
      ? amountNum
      : rate
        ? round2(amountNum / (1 + rate / 100))
        : amountNum;
  const vatAmountValue = isTransfer ? 0 : round2((netValue * rate) / 100);
  const totalValue = netValue + vatAmountValue;

  const sameWalletError =
    isTransfer && walletId && toWalletId && walletId === toWalletId;

  const submitDisabled =
    wallets.length === 0 ||
    Boolean(sameWalletError) ||
    (!isTransfer && vatRates.length === 0);

  function handleDateChange(value: string) {
    setDate(value);
    if (!invoiceDateTouched) {
      setInvoiceDate(value);
    }
  }

  function handleInvoiceDateChange(value: string) {
    setInvoiceDate(value);
    setInvoiceDateTouched(true);
  }

  // Switching modes converts the number already typed instead of blanking
  // it, so "I meant total" doesn't lose what was just entered. netValue and
  // totalValue above are already correctly derived from whichever mode is
  // currently active, so the target mode's value is just sitting there.
  function switchAmountMode(next: AmountMode) {
    if (next === amountMode) return;
    if (amountInput !== "") {
      setAmountInput(String(next === "total" ? totalValue : netValue));
    }
    setAmountMode(next);
  }

  // --- Add-flow submission (Cancel / Add + New / Add + Same / Add) ---
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runAction(formData: FormData, onSuccess: () => void) {
    startTransition(async () => {
      try {
        setError(null);
        await action(formData);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  /** Everything the just-submitted form held, minus the amount — "Add + Same" seeds the next transaction with this. Read straight off the submitted FormData rather than duplicating entity/category selection in local state. */
  function buildSameSeed(formData: FormData): TransactionSeed {
    const formType = (formData.get("type") as TransactionType) ?? type;
    const entityId = String(formData.get("entity_id") ?? "");
    const categoryId = String(formData.get("category_id") ?? "");
    const entityMatch = entities.find((e) => e.id === entityId) ?? null;
    const categoryMatch = categories.find((c) => c.id === categoryId) ?? null;
    return {
      date: String(formData.get("date") ?? date),
      invoice_date: String(formData.get("invoice_date") ?? invoiceDate),
      description: String(formData.get("description") ?? ""),
      type: formType,
      net: "",
      entity: entityMatch ? { id: entityMatch.id, name: entityMatch.name } : null,
      category: categoryMatch ? { id: categoryMatch.id, name: categoryMatch.name } : null,
      wallet_id: String(formData.get("wallet_id") ?? ""),
      to_wallet_id: formType === "transfer" ? String(formData.get("to_wallet_id") ?? "") : null,
      vat_rate_id: formType === "transfer" ? null : String(formData.get("vat_rate_id") ?? ""),
      amountMode,
    };
  }

  function handleAddClick(formData: FormData) {
    runAction(formData, () => addVariants!.onAddClose());
  }
  function handleAddSameClick(formData: FormData) {
    const seed = buildSameSeed(formData);
    runAction(formData, () => addVariants!.onAddSame(seed));
  }
  function handleAddNewClick(formData: FormData) {
    runAction(formData, () => addVariants!.onAddNew());
  }

  const footer = addVariants ? (
    <>
      {error && (
        <p className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          formAction={handleAddNewClick}
          disabled={isPending || submitDisabled}
          className="inline-flex items-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-ink-muted transition hover:border-edge-strong hover:text-ink disabled:opacity-50"
        >
          Add + New
        </button>
        <button
          type="submit"
          formAction={handleAddSameClick}
          disabled={isPending || submitDisabled}
          className="inline-flex items-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-ink-muted transition hover:border-edge-strong hover:text-ink disabled:opacity-50"
        >
          Add + Same
        </button>
        <button
          type="submit"
          formAction={handleAddClick}
          disabled={isPending || submitDisabled}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Add"}
        </button>
      </div>
    </>
  ) : undefined;

  return (
    <ModalShell
      dialogRef={dialogRef}
      title={title}
      submitLabel={submitLabel ?? "Save"}
      action={action}
      onDone={onDone}
      maxWidth="max-w-2xl"
      submitDisabled={submitDisabled}
      footer={footer}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
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
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`${formInputClass} [color-scheme:light]`}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-invoice-date`} className={formLabelClass}>
            Invoice date
          </label>
          <input
            id={`${uid}-invoice-date`}
            name="invoice_date"
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => handleInvoiceDateChange(e.target.value)}
            className={`${formInputClass} [color-scheme:light]`}
          />
        </div>

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
          <>
            <EntityCombobox
              entities={entities}
              defaultValue={defaultValues?.entity ?? null}
              onAddNew={() => addEntityDialogRef.current?.showModal()}
            />

            <CategoryCombobox
              categories={categories}
              type={type}
              defaultValue={defaultValues?.category ?? null}
              onAddNew={() => addCategoryDialogRef.current?.showModal()}
            />

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
          </>
        )}

        <div className="sm:col-span-2">
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

        {isTransfer ? (
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-amount`} className={formLabelClass}>
              Amount
            </label>
            <input
              id={`${uid}-amount`}
              name="net"
              type="number"
              step="0.01"
              min="0"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className={formInputClass}
            />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor={`${uid}-amount`} className="text-sm text-ink-muted">
                {amountMode === "net" ? "Net" : "Total"}
              </label>
              <div
                role="radiogroup"
                aria-label="Amount entry mode"
                className="inline-flex gap-0.5 rounded-md border border-edge bg-canvas p-0.5"
              >
                {AMOUNT_MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={amountMode === opt.value}
                    onClick={() => switchAmountMode(opt.value)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                      amountMode === opt.value
                        ? "bg-surface-raised text-ink shadow-sm"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              id={`${uid}-amount`}
              name={amountMode === "net" ? "net" : undefined}
              type="number"
              step="0.01"
              min="0"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className={formInputClass}
            />
            {amountMode === "total" && (
              <input type="hidden" name="net" value={netValue.toFixed(2)} />
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5 rounded-lg bg-canvas p-3">
        {!isTransfer && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Net</span>
              <span className="tabular-nums text-ink">{formatAmount(netValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">VAT amount</span>
              <span className="tabular-nums text-ink">{formatAmount(vatAmountValue)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-ink">Total</span>
          <span className="tabular-nums text-ink">{formatAmount(totalValue)}</span>
        </div>
      </div>
    </ModalShell>
  );
}
