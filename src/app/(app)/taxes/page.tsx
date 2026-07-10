import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatAmount, formatMonthYear } from "@/lib/format";
import { getMonthlyVat, currentPeriod, previousPeriod } from "./queries";
import { TAX_TYPES } from "./tax-types";

export default async function TaxesPage() {
  const supabase = await createClient();
  const months = await getMonthlyVat(supabase);

  const thisPeriod = currentPeriod();
  const lastPeriod = previousPeriod(thisPeriod);
  // VAT is filed/paid based on the *previous* month's net (Greek VAT
  // practice, explicit user description) — "this month so far" is the
  // current month's net still accumulating, not what's actually due yet.
  const payableThisMonth = months.find((m) => m.period === lastPeriod)?.net ?? 0;
  const thisMonthNet = months.find((m) => m.period === thisPeriod)?.net ?? 0;

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-3xl font-bold text-ink">Taxes</h1>

      {/* Card content below is VAT-specific (payable/this-month-net don't
          generalize to every possible tax type) — once a second tax type
          exists, branch on tax.slug here rather than forcing its numbers
          into this same two-figure shape. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TAX_TYPES.map((tax) => (
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
                  Payable this month
                  <span className="block text-[11px] text-ink-faint">
                    {formatMonthYear(lastPeriod)} net
                  </span>
                </p>
                <p className="text-2xl font-semibold tabular-nums text-ink">
                  {formatAmount(payableThisMonth)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">
                  This month so far
                  <span className="block text-[11px] text-ink-faint">
                    {formatMonthYear(thisPeriod)} net
                  </span>
                </p>
                <p className="text-2xl font-semibold tabular-nums text-ink">
                  {formatAmount(thisMonthNet)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
