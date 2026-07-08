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
      className="cursor-pointer border-b hover:bg-neutral-50"
    >
      <td className="py-2">{vatRate.name}</td>
      <td className="py-2 text-right">{vatRate.rate}%</td>
      <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
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
