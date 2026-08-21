"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteWithheldTaxRate, updateWithheldTaxRate } from "./withheld-tax-rate-actions";
import { WithheldTaxRateFormDialog } from "./withheld-tax-rate-form-dialog";
import type { WithheldTaxRate } from "./withheld-tax-rate-queries";

export function WithheldTaxRateRow({ withheldTaxRate }: { withheldTaxRate: WithheldTaxRate }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3 text-sm text-ink">{withheldTaxRate.name}</td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-ink">
        {withheldTaxRate.rate}%
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteWithheldTaxRate(withheldTaxRate.id)}
          confirmMessage="Delete this withheld tax rate?"
          label="Delete withheld tax rate"
        />

        <WithheldTaxRateFormDialog
          dialogRef={dialogRef}
          title="Edit withheld tax rate"
          submitLabel="Save"
          defaultValues={{ name: withheldTaxRate.name, rate: withheldTaxRate.rate }}
          action={updateWithheldTaxRate.bind(null, withheldTaxRate.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
