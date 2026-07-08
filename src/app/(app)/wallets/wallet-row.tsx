"use client";

import { useRef } from "react";
import Link from "next/link";
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
    <tr className="border-b hover:bg-neutral-50">
      <td className="py-2">
        <Link href={`/wallets/${wallet.id}`} className="underline">
          {wallet.name}
        </Link>
      </td>
      <td className="py-2 text-right">{formatAmount(balance)}</td>
      <td className="py-2 text-right">
        <button
          type="button"
          onClick={openEdit}
          aria-label="Edit wallet"
          className="rounded p-1.5 text-neutral-600 hover:text-black"
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
