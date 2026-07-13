"use client";

import { useRef, useState, useTransition } from "react";
import { useDialog } from "@/components/dialog/use-dialog";
import { ModalShell } from "@/components/dialog/modal-shell";
import { formInputClass, formLabelClass } from "@/components/form-styles";
import { formatAmount } from "@/lib/format";
import { parseImportFile, commitImport, type ImportPreview } from "./import-actions";

type Step = "upload" | "preview" | "done";

async function noopAction() {}

/**
 * The transactions page's permanent "Import" trigger + dialog — a 3-step
 * flow (upload -> preview -> done) rather than the app's usual single-form
 * ModalShell pattern, since there's no single "submit" here: parsing a
 * file is a pure read (parseImportFile, no DB writes) the user reviews
 * before committing (commitImport, the actual writes). See Summary.md for
 * the column mapping this expects and the tradeoffs behind it.
 */
export function ImportTransactionsModal() {
  const { dialogRef, open, close } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setStep("upload");
    setPreview(null);
    setImportedCount(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    close();
  }

  function handleParse() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    setError(null);
    startTransition(async () => {
      try {
        const result = await parseImportFile(formData);
        setPreview(result);
        setStep("preview");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleCommit() {
    if (!preview) return;
    setError(null);
    startTransition(async () => {
      try {
        const { imported } = await commitImport(preview.rows);
        setImportedCount(imported);
        setStep("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  const title =
    step === "upload" ? "Import transactions" : step === "preview" ? "Review import" : "Import complete";

  const cancelLink = (
    <button
      type="button"
      onClick={handleClose}
      className="text-sm text-ink-faint underline decoration-edge-strong underline-offset-4 hover:text-ink"
    >
      {step === "done" ? "Close" : "Cancel"}
    </button>
  );

  const footer = (
    <>
      {error && (
        <p className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-4 pt-1">
        {step !== "done" && cancelLink}
        {step === "upload" && (
          <button
            type="button"
            onClick={handleParse}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
          >
            {isPending ? "Reading…" : "Parse file"}
          </button>
        )}
        {step === "preview" && preview && (
          <button
            type="button"
            onClick={handleCommit}
            disabled={isPending || preview.rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
          >
            {isPending
              ? "Importing…"
              : `Import ${preview.rows.length} transaction${preview.rows.length === 1 ? "" : "s"}`}
          </button>
        )}
        {step === "done" && (
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110 active:translate-y-px"
          >
            Done
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-ink-muted transition hover:border-edge-strong hover:text-ink"
      >
        Import
      </button>

      <ModalShell
        dialogRef={dialogRef}
        title={title}
        action={noopAction}
        onDone={handleClose}
        maxWidth="max-w-lg"
        footer={footer}
      >
        {step === "upload" && (
          <div>
            <label htmlFor="import-file" className={formLabelClass}>
              Excel file (.xlsx)
            </label>
            <input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept=".xlsx"
              className={formInputClass}
            />
            <p className="mt-2 text-xs text-ink-faint">
              Expected columns: Date, Account, Income, Expense, Category, Counterparty,
              Description, VAT, Bacon. Amounts are read as totals — VAT is removed to get the
              net. Every row becomes a plain Income or Expense transaction; nothing is written
              until you confirm on the next screen.
            </p>
          </div>
        )}

        {step === "preview" && preview && <ImportPreviewSummary preview={preview} />}

        {step === "done" && (
          <p className="text-sm text-ink">
            Imported {importedCount} transaction{importedCount === 1 ? "" : "s"}.
          </p>
        )}
      </ModalShell>
    </>
  );
}

function ImportPreviewSummary({ preview }: { preview: ImportPreview }) {
  const { rows, errors, newWallets, newCategories, newEntities, totals } = preview;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-canvas p-3 text-sm">
        <p className="text-ink">
          <span className="font-semibold">{totals.count}</span> transaction
          {totals.count === 1 ? "" : "s"} ready ({totals.incomeCount} income,{" "}
          {totals.expenseCount} expense)
        </p>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-ink-muted">Net</span>
            <span className="tabular-nums text-ink">{formatAmount(totals.net)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">VAT amount</span>
            <span className="tabular-nums text-ink">{formatAmount(totals.vatAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-ink">Total</span>
            <span className="tabular-nums text-ink">{formatAmount(totals.total)}</span>
          </div>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-expense">
          No valid rows found — nothing would be imported. Check the errors below.
        </p>
      )}

      <NamedListSection title="New wallets" items={newWallets} />
      <NamedListSection
        title="New categories"
        items={newCategories.map((c) => `${c.name} (${c.type})`)}
      />
      <NamedListSection title="New entities" items={newEntities} />

      {errors.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-semibold text-expense">
            {errors.length} row{errors.length === 1 ? "" : "s"} will be skipped
          </p>
          <ul className="max-h-32 space-y-0.5 overflow-y-auto rounded-lg bg-expense-soft p-2 text-xs text-expense">
            {errors.map((e) => (
              <li key={e.row}>
                Row {e.row}: {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NamedListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-ink">
        {title} ({items.length})
      </p>
      <ul className="max-h-32 overflow-y-auto rounded-lg bg-canvas p-2 text-xs text-ink-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
