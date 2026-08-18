import { redirect } from "next/navigation";

// Moved to /settings/vat-rates (2026-08). Redirect kept for old links.
export default function VatRatesRedirect() {
  redirect("/settings/vat-rates");
}
