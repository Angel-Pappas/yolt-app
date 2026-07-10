import { redirect } from "next/navigation";

/**
 * The per-wallet ledger used to live at this route (2026-07 through
 * 2026-07); it's been folded into Transactions' "balance view" (see
 * transactions/balance-view-control.tsx and Summary.md) so there's one
 * table implementation instead of two near-identical ones. This route is
 * kept only as a redirect so old bookmarks/links (and anything cached)
 * still land somewhere correct instead of 404ing.
 */
export default async function WalletLedgerRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/transactions?balance=${id}`);
}
