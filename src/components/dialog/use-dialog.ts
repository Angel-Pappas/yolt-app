"use client";

import { useRef } from "react";

/**
 * The ref + open()/close() boilerplate every dialog trigger (an "Add"
 * button, a row's edit click, Reconcile/Invoice) used to hand-roll
 * itself. `open()` guards against calling `showModal()` on an
 * already-open dialog, which throws.
 */
export function useDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open() {
    if (dialogRef.current?.open) return;
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return { dialogRef, open, close };
}
