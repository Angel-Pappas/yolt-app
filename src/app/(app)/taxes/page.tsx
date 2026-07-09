import { createClient } from "@/lib/supabase/server";
import { formatAmount } from "@/lib/format";
import { getTotalVat } from "./queries";

export default async function TaxesPage() {
  const supabase = await createClient();
  const totalVat = await getTotalVat(supabase);

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-3xl font-bold text-ink">Taxes</h1>

      <section className="max-w-sm space-y-1.5 rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
          VAT
        </h2>
        <p className="text-3xl font-semibold tabular-nums text-ink">
          {formatAmount(totalVat)}
        </p>
        <p className="text-sm text-ink-muted">
          Total VAT across all transactions.
        </p>
      </section>
    </div>
  );
}
