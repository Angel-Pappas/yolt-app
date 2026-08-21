import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireFinance } from "../require-access";
import { formatAmount, formatMonthYear } from "@/lib/format";
import { getMonthlyVatLedger, getMonthlyWithheldLedger, currentPeriod } from "./queries";
import { TAX_TYPES, type TaxTypeSlug } from "./tax-types";

/** The two figures each tax card shows for the current period. Each tax type computes its own — see the comment below on why this can't be one generic shape. */
type TaxCardFigures = {
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel: string;
  secondaryValue: number;
};

export default async function TaxesPage() {
  await requireFinance();
  const supabase = await createClient();
  const [vatMonths, withheldMonths] = await Promise.all([
    getMonthlyVatLedger(supabase),
    getMonthlyWithheldLedger(supabase),
  ]);

  const thisPeriod = currentPeriod();
  const vatRow = vatMonths.find((m) => m.period === thisPeriod);
  const withheldRow = withheldMonths.find((m) => m.period === thisPeriod);

  // Each tax type's card is genuinely tax-specific — VAT's "payable" already
  // folds in credit rollover + deferred installments (see getMonthlyVatLedger),
  // while withholding's "payable this month" is simply last month's collected
  // withholding, due now. A generic shape would misrepresent one or the other,
  // so each computes its own two figures here.
  const figures: Record<TaxTypeSlug, TaxCardFigures> = {
    vat: {
      primaryLabel: "Payable this month",
      primaryValue: vatRow?.payableThisMonth ?? 0,
      secondaryLabel: "This month's net",
      secondaryValue: vatRow?.net ?? 0,
    },
    withheld: {
      primaryLabel: "Payable this month",
      primaryValue: withheldRow?.payableThisMonth ?? 0,
      secondaryLabel: "Withheld this month",
      secondaryValue: withheldRow?.withheld ?? 0,
    },
  };

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-3xl font-bold text-ink">Taxes</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TAX_TYPES.map((tax) => {
          const f = figures[tax.slug];
          return (
            <Link
              key={tax.slug}
              href={`/taxes/${tax.slug}`}
              className="space-y-3 rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)] transition hover:border-accent hover:shadow-[var(--shadow-pop)]"
            >
              <h2 className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
                {tax.label}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-ink-muted">
                    {f.primaryLabel}
                    <span className="block text-[11px] text-ink-faint">
                      {formatMonthYear(thisPeriod)}
                    </span>
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-ink">
                    {formatAmount(f.primaryValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">
                    {f.secondaryLabel}
                    <span className="block text-[11px] text-ink-faint">
                      {formatMonthYear(thisPeriod)}
                    </span>
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-ink">
                    {formatAmount(f.secondaryValue)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
