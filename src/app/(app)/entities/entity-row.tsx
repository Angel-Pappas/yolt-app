"use client";

import { useDialog } from "@/components/dialog/use-dialog";
import { DeleteButton } from "@/components/dialog/delete-button";
import { tableRowClass } from "@/components/table/table-styles";
import { deleteEntity, updateEntity } from "./actions";
import { EntityFormDialog } from "./entity-form-dialog";
import type { Entity } from "./queries";

export function EntityRow({ entity }: { entity: Entity }) {
  const { dialogRef, open, close } = useDialog();

  return (
    <tr onClick={open} className={tableRowClass()}>
      <td className="px-4 py-3 text-sm text-ink">{entity.name}</td>
      <td className="px-4 py-3 text-sm text-ink-muted">
        {entity.vat_number ?? "—"}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteButton
          action={() => deleteEntity(entity.id)}
          confirmMessage="Delete this entity?"
          label="Delete entity"
        />

        <EntityFormDialog
          dialogRef={dialogRef}
          title="Edit entity"
          submitLabel="Save"
          defaultValues={{
            name: entity.name,
            vat_number: entity.vat_number,
          }}
          action={updateEntity.bind(null, entity.id)}
          onDone={close}
        />
      </td>
    </tr>
  );
}
