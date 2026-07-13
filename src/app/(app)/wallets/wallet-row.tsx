"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { formatAmount } from "@/lib/format";
import { deleteWallet, updateWallet } from "./actions";
import { WalletFormDialog } from "./wallet-form-dialog";
import type { Wallet } from "./queries";

export function WalletRow({
  wallet,
  balance,
}: {
  wallet: Wallet;
  balance: number;
}) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3 text-sm text-ink">{wallet.name}</td>
      <td
        className={`px-4 py-3 text-right text-sm font-semibold tabular-nums ${
          balance < 0 ? "text-expense" : "text-ink"
        }`}
      >
        {formatAmount(balance)}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteWallet(wallet.id)}
          confirmMessage="Delete this wallet?"
          label="Delete wallet"
        />

        <WalletFormDialog
          dialogRef={dialogRef}
          title="Edit wallet"
          submitLabel="Save"
          defaultValues={{ name: wallet.name, starting_balance: wallet.starting_balance }}
          action={updateWallet.bind(null, wallet.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
