import { createClient } from "@/lib/supabase/server";
import { updateEmail, updatePassword } from "./actions";
import { addVatRate } from "./vat-rate-actions";
import { getActiveVatRates } from "./vat-rate-queries";
import { VatRateModal } from "./vat-rate-modal";
import { VatRateRow } from "./vat-rate-row";

export default async function OptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = (data?.claims?.email as string | undefined) ?? "";
  const { data: vatRates } = await getActiveVatRates(supabase);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold">Options</h1>

      {message && <p className="text-sm text-neutral-700">{message}</p>}

      <section className="space-y-3 rounded border p-4">
        <h2 className="text-lg font-semibold">Email</h2>
        <p className="text-sm text-neutral-500">Current: {email}</p>
        <form
          action={updateEmail}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-48 flex-1">
            <label htmlFor="email" className="block text-sm">
              New email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={email}
              className="w-full rounded border px-2 py-1"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-black px-3 py-1.5 text-sm text-white"
          >
            Update email
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded border p-4">
        <h2 className="text-lg font-semibold">Password</h2>
        <form
          action={updatePassword}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-48 flex-1">
            <label htmlFor="password" className="block text-sm">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded border px-2 py-1"
            />
          </div>
          <div className="min-w-48 flex-1">
            <label htmlFor="confirmPassword" className="block text-sm">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="w-full rounded border px-2 py-1"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-black px-3 py-1.5 text-sm text-white"
          >
            Update password
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">VAT rates</h2>
          <VatRateModal
            trigger="Add"
            title="Add VAT rate"
            submitLabel="Add"
            action={addVatRate}
          />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vatRates?.map((v) => (
              <VatRateRow key={v.id} vatRate={v} />
            ))}
            {vatRates?.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-neutral-500">
                  No VAT rates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
