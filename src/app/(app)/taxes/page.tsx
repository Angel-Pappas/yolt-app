import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatAmount } from "@/lib/format";
import { getTotalVat } from "./queries";
import { TAX_TYPES } from "./tax-types";

export default async function TaxesPage() {
  const supabase = await createClient();
  const totalVat = await getTotalVat(supabase);

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-3xl font-bold text-ink">Taxes</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TAX_TYPES.map((tax) => (
          <Link
            key={tax.slug}
            href={`/taxes/${tax.slug}`}
            className="space-y-1.5 rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)] transition hover:border-accent hover:shadow-[var(--shadow-pop)]"
          >
            <h2 className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
              {tax.label}
            </h2>
            <p className="text-3xl font-semibold tabular-nums text-ink">
              {formatAmount(totalVat)}
            </p>
            <p className="text-sm text-ink-muted">
              Total across all transactions — see the monthly breakdown.
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
