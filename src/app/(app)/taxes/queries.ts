import type { TypedSupabaseClient } from "@/lib/supabase/types";

/** Greek VAT rule (researched 2026-07, confirmed by the user): a debit over this amount, on an on-time return, may be split into 2 equal interest-free installments. This app always treats that option as taken. */
const INSTALLMENT_THRESHOLD = 100;

export type MonthlyVat = {
  /** "yyyy-mm" */
  period: string;
  /** VAT collected through income — owed to the state. */
  outputVat: number;
  /** VAT paid through expenses — reduces what's owed. */
  inputVat: number;
  /** outputVat - inputVat for this period alone, unadjusted by any rollover — the period's own raw activity. */
  net: number;
  /** Credit carried in from a previous period's negative net — reduces what this period owes. Always >= 0. */
  rolloverIn: number;
  /** Cash actually due *this* calendar month: this period's own installment due now, plus the previous period's deferred 2nd installment landing this month. */
  payableThisMonth: number;
  /** The portion of *this* period's own debit deferred to next month (its 2nd installment) — 0 unless this period's post-rollover debit exceeded the threshold. */
  payableNextMonth: number;
};

type VatBearingRow = {
  type: "income" | "expense";
  vat_amount: string;
  invoice_date: string;
};

/** Rounds to 2 decimals, avoiding floating-point residue from the /2 installment split. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Per Greek VAT law (explicit user description, 2026-07, confirmed by
 * research — see chat): a negative net for a period ("πιστωτικό") is
 * carried forward as a credit that reduces a later period's debit, not
 * refunded or expired (this app doesn't model the 5-year statute of
 * limitations on unused credit — a single ongoing company will use it
 * long before that becomes relevant). A positive net ("χρεωστικό"), after
 * applying any incoming credit, is payable in full if €100 or under; if
 * over €100, it's split into two equal interest-free installments — half
 * due with this period's own filing, half due the following month. This
 * app always treats the installment option as taken (there's no toggle).
 *
 * Walks every period from the earliest VAT-bearing transaction through
 * the later of (the latest transaction's period) or (the current period)
 * — so the current month always appears, even with zero transactions so
 * far, with a correctly carried-in credit/deferred installment — filling
 * any zero-activity month in between, since a deferred installment or a
 * carried credit still has to pass *through* a quiet month to reach the
 * next one with activity.
 *
 * Always the **full**, unfiltered, chronological (oldest-first) ledger —
 * later periods depend on every one before them, so this can never be
 * computed over a filtered subset. `getMonthlyVatList()` below is the
 * filtered/sorted/paginated view built on top of this for the VAT detail
 * page; the Taxes card uses this one directly so it can always find the
 * current period regardless of what page a filtered list would land it
 * on — same split as `getActiveWallets()` vs `getWalletsList()`.
 */
export async function getMonthlyVatLedger(supabase: TypedSupabaseClient): Promise<MonthlyVat[]> {
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

  if (byPeriod.size === 0) {
    return [];
  }

  const periodsWithData = [...byPeriod.keys()].sort();
  const earliest = periodsWithData[0];
  const latestWithData = periodsWithData[periodsWithData.length - 1];
  const today = currentPeriod();
  const latest = latestWithData > today ? latestWithData : today;

  const months: MonthlyVat[] = [];
  let creditCarry = 0;
  let deferredIncoming = 0;

  for (let period = earliest; ; period = nextPeriod(period)) {
    const activity = byPeriod.get(period) ?? { outputVat: 0, inputVat: 0 };
    const rawNet = activity.outputVat - activity.inputVat;
    const netAfterCredit = rawNet - creditCarry;

    let ownDueNow = 0;
    let deferredOutgoing = 0;
    let creditCarryOut = 0;

    if (netAfterCredit <= 0) {
      creditCarryOut = -netAfterCredit;
    } else if (netAfterCredit <= INSTALLMENT_THRESHOLD) {
      ownDueNow = netAfterCredit;
    } else {
      ownDueNow = netAfterCredit / 2;
      deferredOutgoing = netAfterCredit / 2;
    }

    months.push({
      period,
      outputVat: activity.outputVat,
      inputVat: activity.inputVat,
      net: rawNet,
      rolloverIn: creditCarry,
      payableThisMonth: round2(ownDueNow + deferredIncoming),
      payableNextMonth: round2(deferredOutgoing),
    });

    creditCarry = creditCarryOut;
    deferredIncoming = deferredOutgoing;

    if (period === latest) break;
  }

  return months;
}

export type MonthlyVatFilters = {
  /** Compared against the 1st of each period. Inclusive, ISO "yyyy-mm-dd". */
  periodFrom?: string;
  periodTo?: string;
  incomeVatMin?: number;
  incomeVatMax?: number;
  expenseVatMin?: number;
  expenseVatMax?: number;
  netMin?: number;
  netMax?: number;
  rolloverMin?: number;
  rolloverMax?: number;
  payableThisMin?: number;
  payableThisMax?: number;
  payableNextMin?: number;
  payableNextMax?: number;
};

export type MonthlyVatSortKey =
  | "period"
  | "outputVat"
  | "inputVat"
  | "net"
  | "rolloverIn"
  | "payableThisMonth"
  | "payableNextMonth";
export type MonthlyVatSortDir = "asc" | "desc";

export const MONTHLY_VAT_SORT_KEYS: MonthlyVatSortKey[] = [
  "period",
  "outputVat",
  "inputVat",
  "net",
  "rolloverIn",
  "payableThisMonth",
  "payableNextMonth",
];

export type MonthlyVatListParams = {
  filters?: MonthlyVatFilters;
  sort?: MonthlyVatSortKey;
  dir?: MonthlyVatSortDir;
};

export type MonthlyVatListResult = {
  months: MonthlyVat[];
  totalCount: number;
};

/**
 * The VAT detail page's own list view: filter/sort/pagination, part of
 * the shared table template (see src/components/table/). Built on top of
 * `getMonthlyVatLedger()` — filters/sorts/paginates the *already-computed*
 * full ledger rather than pushing any of that into the ledger computation
 * itself, the same "compute complete history first, filter for display
 * after" split `getWalletTransactionsWithBalance()` already uses and for
 * the same reason: a filtered subset can't be walked correctly, since
 * later rows depend on every row before them.
 *
 * Sorting by anything other than period will make Roll over/Payable
 * this-next month stop reading as a coherent chain — same accepted,
 * documented tradeoff as the old wallet ledger's running-balance column.
 */
export async function getMonthlyVatList(
  supabase: TypedSupabaseClient,
  params: MonthlyVatListParams = {}
): Promise<MonthlyVatListResult> {
  const filters = params.filters ?? {};
  const sort = params.sort ?? "period";
  const dir = params.dir ?? "asc";

  const all = await getMonthlyVatLedger(supabase);

  let filtered = all;
  if (filters.periodFrom) {
    filtered = filtered.filter((m) => `${m.period}-01` >= filters.periodFrom!);
  }
  if (filters.periodTo) {
    filtered = filtered.filter((m) => `${m.period}-01` <= filters.periodTo!);
  }
  if (filters.incomeVatMin !== undefined) {
    filtered = filtered.filter((m) => m.outputVat >= filters.incomeVatMin!);
  }
  if (filters.incomeVatMax !== undefined) {
    filtered = filtered.filter((m) => m.outputVat <= filters.incomeVatMax!);
  }
  if (filters.expenseVatMin !== undefined) {
    filtered = filtered.filter((m) => m.inputVat >= filters.expenseVatMin!);
  }
  if (filters.expenseVatMax !== undefined) {
    filtered = filtered.filter((m) => m.inputVat <= filters.expenseVatMax!);
  }
  if (filters.netMin !== undefined) {
    filtered = filtered.filter((m) => m.net >= filters.netMin!);
  }
  if (filters.netMax !== undefined) {
    filtered = filtered.filter((m) => m.net <= filters.netMax!);
  }
  if (filters.rolloverMin !== undefined) {
    filtered = filtered.filter((m) => m.rolloverIn >= filters.rolloverMin!);
  }
  if (filters.rolloverMax !== undefined) {
    filtered = filtered.filter((m) => m.rolloverIn <= filters.rolloverMax!);
  }
  if (filters.payableThisMin !== undefined) {
    filtered = filtered.filter((m) => m.payableThisMonth >= filters.payableThisMin!);
  }
  if (filters.payableThisMax !== undefined) {
    filtered = filtered.filter((m) => m.payableThisMonth <= filters.payableThisMax!);
  }
  if (filters.payableNextMin !== undefined) {
    filtered = filtered.filter((m) => m.payableNextMonth >= filters.payableNextMin!);
  }
  if (filters.payableNextMax !== undefined) {
    filtered = filtered.filter((m) => m.payableNextMonth <= filters.payableNextMax!);
  }

  const sorted = [...filtered].sort((a, b) => {
    let cmp: number;
    switch (sort) {
      case "outputVat":
        cmp = a.outputVat - b.outputVat;
        break;
      case "inputVat":
        cmp = a.inputVat - b.inputVat;
        break;
      case "net":
        cmp = a.net - b.net;
        break;
      case "rolloverIn":
        cmp = a.rolloverIn - b.rolloverIn;
        break;
      case "payableThisMonth":
        cmp = a.payableThisMonth - b.payableThisMonth;
        break;
      case "payableNextMonth":
        cmp = a.payableNextMonth - b.payableNextMonth;
        break;
      default:
        cmp = a.period.localeCompare(b.period);
    }
    return dir === "asc" ? cmp : -cmp;
  });

  return { months: sorted, totalCount: sorted.length };
}

/** The current "yyyy-mm" period, server clock. */
export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/** The "yyyy-mm" period immediately before the given one. */
export function previousPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}

/** The "yyyy-mm" period immediately after the given one. */
export function nextPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const next = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(next).padStart(2, "0")}`;
}
