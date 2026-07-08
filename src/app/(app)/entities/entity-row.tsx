"use client";

import { useRef } from "react";
import { updateEntity } from "./actions";
import { EntityFormDialog } from "./entity-form-dialog";
import { DeleteEntityButton } from "./delete-entity-button";
import type { Entity } from "./queries";

export function EntityRow({ entity }: { entity: Entity }) {
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
      className="group cursor-pointer border-b border-edge transition-colors last:border-b-0 hover:bg-canvas"
    >
      <td className="px-4 py-3 text-sm text-ink">{entity.name}</td>
      <td className="px-4 py-3 text-sm text-ink-muted">
        {entity.vat_number ?? "—"}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DeleteEntityButton id={entity.id} />

        <EntityFormDialog
          dialogRef={dialogRef}
          title="Edit entity"
          submitLabel="Save"
          defaultValues={{
            name: entity.name,
            vat_number: entity.vat_number,
          }}
          action={updateEntity.bind(null, entity.id)}
          onDone={closeEdit}
        />
      </td>
    </tr>
  );
}
