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
      className="cursor-pointer border-b hover:bg-neutral-50"
    >
      <td className="py-2">{entity.name}</td>
      <td className="py-2">{entity.vat_number ?? "—"}</td>
      <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
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
