import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * VAT owed is never stored — it's a live aggregate over transactions, so
 * it can never drift out of sync as transactions are added, edited,
 * deleted, or restored. When other tax types are added later, each gets
 * its own aggregate computed the same way.
 */
export async function getTotalVat(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("transactions")
    .select("vat_amount")
    .eq("is_deleted", false)
    .returns<{ vat_amount: string }[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.vat_amount), 0);
}

export type MonthlyVat = {
  /** "yyyy-mm" */
  period: string;
  /** VAT collected through income — owed to the state. */
  outputVat: number;
  /** VAT paid through expenses — reduces what's owed. */
  inputVat: number;
  /** outputVat - inputVat. Negative means a credit for that period rather than an amount payable. */
  net: number;
};

type VatBearingRow = {
  type: "income" | "expense";
  vat_amount: string;
  invoice_date: string;
};

/**
 * Per Greek VAT law (explicit user description, 2026-07): VAT collected
 * on income ("output VAT") is owed to the state each period, reduced by
 * VAT already paid on expenses ("input VAT") in that same period. The
 * period a transaction belongs to is its *invoice* date, not its
 * (wallet-affecting) transaction date — e.g. a project invoiced 10 July
 * but paid 12 August still counts toward July's VAT, regardless of when
 * the money actually moved. See transactions/queries.ts's `invoice_date`.
 *
 * Fetches every VAT-bearing row (income/expense only — transfers never
 * carry VAT) and aggregates by month in JS, the same pattern
 * getWalletBalances (wallets/queries.ts) already uses: PostgREST doesn't
 * support GROUP BY through the standard client, and this app's data
 * volume (a single user's transactions) makes an in-JS reduce entirely
 * reasonable rather than reaching for a database view/function.
 */
export async function getMonthlyVat(supabase: SupabaseClient): Promise<MonthlyVat[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("type, vat_amount, invoice_date")
    .eq("is_deleted", false)
    .in("type", ["income", "expense"])
    .returns<VatBearingRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const byPeriod = new Map<string, { outputVat: number; inputVat: number }>();
  for (const row of data ?? []) {
    const period = row.invoice_date.slice(0, 7);
    const entry = byPeriod.get(period) ?? { outputVat: 0, inputVat: 0 };
    const amount = Number(row.vat_amount);
    if (row.type === "income") {
      entry.outputVat += amount;
    } else {
      entry.inputVat += amount;
    }
    byPeriod.set(period, entry);
  }

  return [...byPeriod.entries()]
    .map(([period, { outputVat, inputVat }]) => ({
      period,
      outputVat,
      inputVat,
      net: outputVat - inputVat,
    }))
    .sort((a, b) => b.period.localeCompare(a.period));
}
