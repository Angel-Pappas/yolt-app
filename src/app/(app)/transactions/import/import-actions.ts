"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/format";
import { resolveInvoiceMonthInput } from "../invoice-month";

type TxType = "income" | "expense";

export type ImportRowError = { row: number; reason: string };

/** One transaction resolved from a spreadsheet row — names, not ids, since a new wallet/category/entity's id doesn't exist until commitImport actually creates it. */
export type ResolvedImportRow = {
  date: string;
  invoiceDate: string;
  type: TxType;
  walletName: string;
  categoryName: string;
  entityName: string;
  description: string;
  net: number;
  vatRate: number;
  vatAmount: number;
  invoiceMonth: number | null;
  invoiceNotRequired: boolean;
};

export type ImportPreview = {
  rows: ResolvedImportRow[];
  errors: ImportRowError[];
  newWallets: string[];
  newCategories: { name: string; type: TxType }[];
  newEntities: string[];
  totals: {
    count: number;
    incomeCount: number;
    expenseCount: number;
    net: number;
    vatAmount: number;
    total: number;
  };
};

const REQUIRED_HEADERS = [
  "Date",
  "Account",
  "Income",
  "Expense",
  "Category",
  "Counterparty",
  "Description",
  "VAT",
  "Bacon",
];

/**
 * "Alpha" in the user's spreadsheet is shorthand for the existing "Alpha
 * Bank" wallet — confirmed explicitly by the user (2026-07) rather than
 * guessed, since silently treating it as a *new* wallet would split that
 * account's real balance history across two separate wallet rows. This is
 * the only alias — every other Account/Category/Counterparty value is
 * matched/created literally as written.
 */
const WALLET_ALIASES: Record<string, string> = {
  Alpha: "Alpha Bank",
};

/** ExcelJS represents a formula cell as `{ formula, result }` rather than a plain value — unwrap it either way. */
function cellValue(cell: ExcelJS.Cell): unknown {
  const v = cell.value;
  if (v && typeof v === "object" && "result" in v) {
    return (v as { result: unknown }).result;
  }
  return v;
}

function asTrimmedString(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Parses an uploaded spreadsheet into a preview of what would be imported —
 * a pure read/compute pass, nothing is written to the database here. The
 * companion `commitImport()` does the actual writes, taking exactly the
 * `rows` this returns (the client holds the parsed preview in memory
 * between the two calls rather than re-uploading/re-parsing the file).
 *
 * Column headers are matched by name (not fixed position), so a reordered
 * spreadsheet still works. Every row needs an entity, category, and a VAT
 * rate that already exists (0%/24% today) — see Summary.md for why wallets
 * get auto-created but VAT rates don't.
 */
export async function parseImportFile(formData: FormData): Promise<ImportPreview> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }

  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new Error("Couldn't read that file — make sure it's a valid .xlsx spreadsheet");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("The spreadsheet has no sheets");
  }

  const colIndex: Record<string, number> = {};
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const header = asTrimmedString(cell.value);
    if (header) colIndex[header] = colNumber;
  });

  const missingHeaders = REQUIRED_HEADERS.filter((h) => !(h in colIndex));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing column(s) in the spreadsheet: ${missingHeaders.join(", ")}`);
  }

  const supabase = await createClient();
  const [{ data: wallets }, { data: categories }, { data: entities }, { data: vatRates }] =
    await Promise.all([
      supabase.from("wallets").select("id, name").eq("is_deleted", false),
      supabase.from("categories").select("id, name, type").eq("is_deleted", false),
      supabase.from("entities").select("id, name").eq("is_deleted", false),
      supabase.from("vat_rates").select("id, rate").eq("is_deleted", false),
    ]);

  const existingWalletNames = new Set((wallets ?? []).map((w) => w.name));
  const existingCategoryKeys = new Set((categories ?? []).map((c) => `${c.name}::${c.type}`));
  const existingEntityNames = new Set((entities ?? []).map((e) => e.name));
  const existingVatRateValues = new Set((vatRates ?? []).map((v) => Number(v.rate)));

  const rows: ResolvedImportRow[] = [];
  const errors: ImportRowError[] = [];
  const newWallets = new Set<string>();
  const newCategoryPairs = new Set<string>();
  const newEntities = new Set<string>();

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const get = (col: string) => cellValue(row.getCell(colIndex[col]));

    const rawAccount = get("Account");
    const rawIncome = get("Income");
    const rawExpense = get("Expense");
    const rawDate = get("Date");

    // Skip fully blank rows (trailing rows past the real data).
    if (rawAccount == null && rawIncome == null && rawExpense == null && rawDate == null) continue;

    const income = asNumber(rawIncome);
    const expense = asNumber(rawExpense);
    const type: TxType | null =
      income != null && income > 0 ? "income" : expense != null && expense > 0 ? "expense" : null;
    if (!type) {
      errors.push({ row: r, reason: "No income or expense amount" });
      continue;
    }

    const date = asDate(rawDate);
    if (!date) {
      errors.push({ row: r, reason: "Invalid or missing date" });
      continue;
    }

    let walletName = asTrimmedString(rawAccount);
    walletName = WALLET_ALIASES[walletName] ?? walletName;
    if (!walletName) {
      errors.push({ row: r, reason: "Missing account/wallet" });
      continue;
    }

    const categoryName = asTrimmedString(get("Category"));
    if (!categoryName) {
      errors.push({ row: r, reason: "Missing category" });
      continue;
    }

    const entityName = asTrimmedString(get("Counterparty"));
    if (!entityName) {
      errors.push({ row: r, reason: "Missing counterparty" });
      continue;
    }

    // A blank description falls back to the category name (2026-07,
    // explicit user direction) rather than blocking the row — the
    // transaction schema requires a non-empty description.
    let description = asTrimmedString(get("Description"));
    if (!description) description = categoryName;

    const vatRate = asNumber(get("VAT"));
    if (vatRate == null || !existingVatRateValues.has(vatRate)) {
      errors.push({ row: r, reason: `Unrecognized VAT rate: ${JSON.stringify(get("VAT"))}` });
      continue;
    }

    // "Bacon" uses the same 1-13 shape as the Invoice modal's own input
    // (13 = "confirmed, no invoice needed") — reuse the exact same
    // translation so the two stay in sync. Anything else (blank, "-", a
    // stray 0 from before the user cleaned the file) resolves to neither.
    const baconRaw = get("Bacon");
    const baconNum = typeof baconRaw === "number" && Number.isInteger(baconRaw) ? baconRaw : null;
    const { invoice_month: invoiceMonth, invoice_not_required: invoiceNotRequired } =
      resolveInvoiceMonthInput(baconNum);

    const total = income != null ? income : (expense as number);
    const net = round2(total / (1 + vatRate / 100));
    // Anchored to total - net (not net * rate) so net + vatAmount always
    // reconstructs the exact total — see resolveLineVatAmount() in
    // actions.ts for why net * rate can drift a cent here (net was
    // already rounded from total/rate, so re-deriving vat from it a
    // second time compounds two independent roundings).
    const vatAmount = Math.max(0, round2(round2(total) - net));
    const isoDate = date.toISOString().slice(0, 10);

    if (!existingWalletNames.has(walletName)) newWallets.add(walletName);
    const categoryKey = `${categoryName}::${type}`;
    if (!existingCategoryKeys.has(categoryKey)) newCategoryPairs.add(categoryKey);
    if (!existingEntityNames.has(entityName)) newEntities.add(entityName);

    rows.push({
      date: isoDate,
      invoiceDate: isoDate,
      type,
      walletName,
      categoryName,
      entityName,
      description,
      net,
      vatRate,
      vatAmount,
      invoiceMonth,
      invoiceNotRequired,
    });
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.count++;
      if (row.type === "income") acc.incomeCount++;
      else acc.expenseCount++;
      acc.net = round2(acc.net + row.net);
      acc.vatAmount = round2(acc.vatAmount + row.vatAmount);
      return acc;
    },
    { count: 0, incomeCount: 0, expenseCount: 0, net: 0, vatAmount: 0, total: 0 }
  );
  totals.total = round2(totals.net + totals.vatAmount);

  return {
    rows,
    errors,
    newWallets: [...newWallets].sort(),
    newCategories: [...newCategoryPairs]
      .map((key) => {
        const [name, type] = key.split("::") as [string, TxType];
        return { name, type };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    newEntities: [...newEntities].sort(),
    totals,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function mustGet<V>(map: Map<string, V>, key: string, label: string): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Could not resolve ${label} "${key}" — try re-parsing the file`);
  }
  return value;
}

const IMPORT_CHUNK_SIZE = 200;

/**
 * Actually writes a previously-parsed batch of rows: creates any
 * wallets/categories/entities the preview flagged as new, then bulk-inserts
 * the transactions and their (always single, for an import) VAT line each.
 * Runs in chunks of 200 rather than one giant insert — each chunk is its
 * own request, so a failure partway through reports how much succeeded
 * rather than silently losing that information; nothing here is wrapped in
 * a single all-or-nothing database transaction (no RPC/stored procedure),
 * which is an accepted tradeoff for a single-user, one-off import tool —
 * every write is a normal insert, so a partial failure is fully
 * recoverable by hand (soft-delete the partial batch, fix the data, and
 * re-run) rather than corrupting anything.
 */
export async function commitImport(rows: ResolvedImportRow[]): Promise<{ imported: number }> {
  if (rows.length === 0) {
    return { imported: 0 };
  }

  const supabase = await createClient();

  const [{ data: wallets }, { data: categories }, { data: entities }, { data: vatRates }] =
    await Promise.all([
      supabase.from("wallets").select("id, name").eq("is_deleted", false),
      supabase.from("categories").select("id, name, type").eq("is_deleted", false),
      supabase.from("entities").select("id, name").eq("is_deleted", false),
      supabase.from("vat_rates").select("id, rate").eq("is_deleted", false),
    ]);

  const walletMap = new Map((wallets ?? []).map((w) => [w.name, w.id]));
  const categoryMap = new Map((categories ?? []).map((c) => [`${c.name}::${c.type}`, c.id]));
  const entityMap = new Map((entities ?? []).map((e) => [e.name, e.id]));
  const vatRateMap = new Map((vatRates ?? []).map((v) => [String(Number(v.rate)), v.id]));

  const missingWalletNames = [...new Set(rows.map((r) => r.walletName))].filter(
    (n) => !walletMap.has(n)
  );
  const missingCategoryKeys = [...new Set(rows.map((r) => `${r.categoryName}::${r.type}`))].filter(
    (k) => !categoryMap.has(k)
  );
  const missingEntityNames = [...new Set(rows.map((r) => r.entityName))].filter(
    (n) => !entityMap.has(n)
  );

  if (missingWalletNames.length > 0) {
    const { data, error } = await supabase
      .from("wallets")
      .insert(missingWalletNames.map((name) => ({ name })))
      .select("id, name");
    if (error) throw new Error(`Creating wallets: ${error.message}`);
    for (const w of data ?? []) walletMap.set(w.name, w.id);
  }

  if (missingCategoryKeys.length > 0) {
    const { data, error } = await supabase
      .from("categories")
      .insert(
        missingCategoryKeys.map((key) => {
          const [name, type] = key.split("::") as [string, TxType];
          return { name, type };
        })
      )
      .select("id, name, type");
    if (error) throw new Error(`Creating categories: ${error.message}`);
    for (const c of data ?? []) categoryMap.set(`${c.name}::${c.type}`, c.id);
  }

  if (missingEntityNames.length > 0) {
    const { data, error } = await supabase
      .from("entities")
      .insert(missingEntityNames.map((name) => ({ name, vat_number: null })))
      .select("id, name");
    if (error) throw new Error(`Creating entities: ${error.message}`);
    for (const e of data ?? []) entityMap.set(e.name, e.id);
  }

  let imported = 0;
  for (const batch of chunk(rows, IMPORT_CHUNK_SIZE)) {
    const transactionFields = batch.map((r) => ({
      date: r.date,
      invoice_date: r.invoiceDate,
      description: r.description,
      type: r.type,
      net: r.net,
      entity_id: mustGet(entityMap, r.entityName, "entity"),
      category_id: mustGet(categoryMap, `${r.categoryName}::${r.type}`, "category"),
      wallet_id: mustGet(walletMap, r.walletName, "wallet"),
      to_wallet_id: null,
      vat_rate_id: mustGet(vatRateMap, String(r.vatRate), "VAT rate"),
      vat_amount: r.vatAmount,
      invoice_month: r.invoiceMonth,
      invoice_not_required: r.invoiceNotRequired,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert(transactionFields)
      .select("id");

    if (insertError || !inserted) {
      throw new Error(
        `Imported ${imported} of ${rows.length} transactions before this batch failed: ${insertError?.message ?? "unknown error"}`
      );
    }

    const lineFields = inserted.map((t, i) => ({
      transaction_id: t.id,
      net: batch[i].net,
      vat_rate_id: mustGet(vatRateMap, String(batch[i].vatRate), "VAT rate"),
      vat_amount: batch[i].vatAmount,
      position: 0,
    }));

    const { error: linesError } = await supabase.from("transaction_vat_lines").insert(lineFields);
    if (linesError) {
      throw new Error(
        `Imported ${imported + inserted.length} of ${rows.length} transactions, but failed writing their VAT breakdown: ${linesError.message}`
      );
    }

    imported += inserted.length;
  }

  revalidatePath("/transactions");
  revalidatePath("/wallets");
  revalidatePath("/taxes");
  revalidatePath("/entities");
  revalidatePath("/lists/categories");

  return { imported };
}
