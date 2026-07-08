import { createClient } from "@/lib/supabase/server";
import { formatAmount } from "@/lib/format";
import { getTotalVat } from "./queries";

export default async function TaxesPage() {
  const supabase = await createClient();
  const totalVat = await getTotalVat(supabase);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold">Taxes</h1>

      <section className="space-y-1 rounded border p-4">
        <h2 className="text-lg font-semibold">VAT</h2>
        <p className="text-2xl font-semibold">{formatAmount(totalVat)}</p>
        <p className="text-sm text-neutral-500">
          Total VAT across all transactions.
        </p>
      </section>
    </div>
  );
}
