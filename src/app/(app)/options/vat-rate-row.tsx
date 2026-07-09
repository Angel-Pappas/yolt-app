"use client";

import { useRef } from "react";
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
      className="group cursor-pointer border-b border-edge transition-colors last:border-b-0 even:bg-surface-alt hover:bg-canvas"
    >
      <td className="px-3 py-3 text-sm text-ink">{vatRate.name}</td>
      <td className="px-3 py-3 text-right text-sm tabular-nums text-ink">
        {vatRate.rate}%
      </td>
      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
