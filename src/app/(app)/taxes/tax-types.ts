/**
 * The list of tax types shown on /taxes (2026-07). Deliberately a small
 * code-defined list, not a user-editable table like Categories/VAT rates —
 * tax rules are law-defined, not arbitrary data the user would add/rename
 * through the UI. Add a new entry here plus a `/taxes/[slug]/page.tsx`
 * (each tax type's computation is genuinely different, so there's no
 * single generic page that could serve all of them).
 */
export type TaxTypeSlug = "vat";

export const TAX_TYPES: { slug: TaxTypeSlug; label: string }[] = [
  { slug: "vat", label: "VAT" },
];
