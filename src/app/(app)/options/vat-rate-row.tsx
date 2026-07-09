"use client";

import { useRef } from "react";
import { tableRowClass } from "@/components/table/table-styles";
import { updateVatRate } from "./vat-rate-actions";
import { VatRateFormDialog } from "./vat-rate-form-dialog";
import { DeleteVatRateButton } from "./delete-vat-rate-button";
import type { VatRate } from "./vat-rate-queries";

export function VatRateRow({ vatRate }: { vatRate: VatRate }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openEdit() {
    if (dialogRef.current?.open) return;
    dialogRef.current?.showModal();
  }

  function closeEdit() {
    dialogRef.current?.close();
  }

  return (
    <tr
      onClick={openEdit}
      className={tableRowClass()}
    >
      <td className="px-4 py-3 text-sm text-ink">{vatRate.name}</td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink">
        {vatRate.rate}%
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteVatRateButton id={vatRate.id} />

        <VatRateFormDialog
          dialogRef={dialogRef}
          title="Edit VAT rate"
          submitLabel="Save"
          defaultValues={{ name: vatRate.name, rate: vatRate.rate }}
          action={updateVatRate.bind(null, vatRate.id)}
          onDone={closeEdit}
        />
      </td>
    </tr>
  );
}
