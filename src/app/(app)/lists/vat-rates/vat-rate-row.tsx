"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteVatRate, updateVatRate } from "./vat-rate-actions";
import { VatRateFormDialog } from "./vat-rate-form-dialog";
import type { VatRate } from "./vat-rate-queries";

export function VatRateRow({ vatRate }: { vatRate: VatRate }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3 text-sm text-ink">{vatRate.name}</td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink">
        {vatRate.rate}%
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteVatRate(vatRate.id)}
          confirmMessage="Delete this VAT rate?"
          label="Delete VAT rate"
        />

        <VatRateFormDialog
          dialogRef={dialogRef}
          title="Edit VAT rate"
          submitLabel="Save"
          defaultValues={{ name: vatRate.name, rate: vatRate.rate }}
          action={updateVatRate.bind(null, vatRate.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
