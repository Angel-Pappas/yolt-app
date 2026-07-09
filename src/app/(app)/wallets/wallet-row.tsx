"use client";

import { useRef } from "react";
import Link from "next/link";
import { tableRowClass } from "@/components/table/table-styles";
import { formatAmount } from "@/lib/format";
import { updateWallet } from "./actions";
import { WalletFormDialog } from "./wallet-form-dialog";
import { DeleteWalletButton } from "./delete-wallet-button";
import { PencilIcon } from "@/components/icons";
import type { Wallet } from "./queries";

export function WalletRow({
  wallet,
  balance,
}: {
  wallet: Wallet;
  balance: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openEdit() {
    if (dialogRef.current?.open) return;
    dialogRef.current?.showModal();
  }

  function closeEdit() {
    dialogRef.current?.close();
  }

  return (
    <tr className={tableRowClass({ interactive: false })}>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/wallets/${wallet.id}`}
          className="font-medium text-ink underline decoration-edge-strong underline-offset-4 hover:text-accent hover:decoration-accent"
        >
          {wallet.name}
        </Link>
      </td>
      <td
        className={`px-4 py-3 text-right text-sm font-semibold tabular-nums ${
          balance < 0 ? "text-expense" : "text-ink"
        }`}
      >
        {formatAmount(balance)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={openEdit}
          aria-label="Edit wallet"
          className="rounded-md p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:bg-canvas hover:text-ink"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <DeleteWalletButton id={wallet.id} />

        <WalletFormDialog
          dialogRef={dialogRef}
          title="Edit wallet"
          submitLabel="Save"
          defaultValues={{ name: wallet.name }}
          action={updateWallet.bind(null, wallet.id)}
          onDone={closeEdit}
        />
      </td>
    </tr>
  );
}
