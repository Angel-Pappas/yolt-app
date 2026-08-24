/**
 * The two top-level areas of the app (Finance and Business/CRM) and their
 * side-nav link sets. This single structure drives the area switcher (top bar),
 * the area-aware side nav, and the launcher home — add an area or a section
 * here, not in three places.
 *
 * Areas are a *view* concept, not a URL prefix: finance pages keep their flat
 * URLs (/transactions, …) and business pages get their own (/leads). "Which
 * area am I in" is derived from the current path (see areaForPath).
 */

export type AreaId = "finance" | "business";

export type NavLink = { href: string; label: string };

export type Area = {
  id: AreaId;
  label: string;
  /** Where entering the area from the launcher/switcher lands. */
  home: string;
  /** Which profile flag grants access to this area. */
  access: "finance" | "crm";
  links: NavLink[];
};

export const AREAS: Area[] = [
  {
    id: "finance",
    label: "Finance",
    home: "/transactions",
    access: "finance",
    links: [
      { href: "/transactions", label: "Transactions" },
      { href: "/entities", label: "Entities" },
      { href: "/wallets", label: "Wallets" },
      { href: "/taxes", label: "Taxes" },
    ],
  },
  {
    id: "business",
    label: "Business",
    home: "/leads",
    access: "crm",
    links: [
      { href: "/leads", label: "Leads" },
      { href: "/projects", label: "Projects" },
    ],
  },
];

/** True when `pathname` is `href` itself or a route nested under it. */
function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Which area a path belongs to, or null for area-neutral routes (the launcher
 * "/" and everything under /settings). Used by the side nav and switcher to
 * decide what to show / highlight.
 */
export function areaForPath(pathname: string): AreaId | null {
  for (const area of AREAS) {
    if (matchesPath(pathname, area.home)) return area.id;
    if (area.links.some((link) => matchesPath(pathname, link.href))) return area.id;
  }
  return null;
}
