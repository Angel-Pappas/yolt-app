"use client";

import { useId, useState } from "react";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import type { Transaction } from "./queries";
import type { Wallet } from "../wallets/queries";

export function ReconcileModal({
  dialogRef,
  transaction,
  wallets,
  action,
  onDone,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  transaction: Transaction;
  wallets: Wallet[];
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
}) {
  const uid = useId();
  const [walletId, setWalletId] = useState(transaction.wallet.id);
  const [toWalletId, setToWalletId] = useState(transaction.to_wallet?.id ?? "");

  const isTransfer = transaction.type === "transfer";
  const sameWalletError =
    isTransfer && walletId && toWalletId && walletId === toWalletId;

  return (
    <ModalShell
      dialogRef={dialogRef}
      action={action}
      onDone={onDone}
      submitLabel="Reconcile"
      submitDisabled={Boolean(sameWalletError)}
      title="Reconcile transaction"
    >
      <input type="hidden" name="type" value={transaction.type} />

      <div>
        <label htmlFor={`${uid}-date`} className={formLabelClass}>
          Date
        </label>
        <input
          id={`${uid}-date`}
          name="date"
          type="date"
          required
          defaultValue={transaction.date}
          className={`${formInputClass} [color-scheme:light]`}
        />
      </div>

      <div>
        <label htmlFor={`${uid}-net`} className={formLabelClass}>
          Amount
        </label>
        <input
          id={`${uid}-net`}
          name="net"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={transaction.net}
          className={formInputClass}
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
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </ModalShell>
  );
}
