"use client";

import { useState } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { ModalShell } from "@/components/dialog/modal-shell";
import { AddButton } from "@/components/table/add-button";
import { ProjectFields } from "./project-fields";
import { addProject } from "./actions";
import type { ProjectStatus } from "../settings/project-statuses/queries";

/**
 * "Add project" — the full project form in a modal on the list, for a project
 * created directly (not from a lead). Saving creates the project and closes the
 * modal, landing back on the list.
 */
export function ProjectAddModal({ statuses }: { statuses: ProjectStatus[] }) {
  const modal = useDialog();
  // Bumped on each open so the uncontrolled fields reset to blank for a fresh add.
  const [generation, setGeneration] = useState(0);

  function handleOpen() {
    setGeneration((g) => g + 1);
    modal.open();
  }

  return (
    <>
      <AddButton trigger="Add project" onClick={handleOpen} />

      <ModalShell
        dialogRef={modal.dialogRef}
        title="Add project"
        submitLabel="Save"
        action={addProject}
        onDone={modal.close}
        maxWidth="max-w-2xl"
      >
        <ProjectFields key={generation} statuses={statuses} />
      </ModalShell>
    </>
  );
}
