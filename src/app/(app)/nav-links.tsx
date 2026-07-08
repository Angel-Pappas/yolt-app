"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Transactions" },
  { href: "/entities", label: "Entities" },
  { href: "/wallets", label: "Wallets" },
  { href: "/taxes", label: "Taxes" },
  { href: "/options", label: "Options" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-7">
      {LINKS.map((link) => {
        // Exact match for Home ("/") so it isn't "active" on every route;
        // prefix match for everything else so a nested route (e.g. a
        // wallet's ledger view) still highlights its section.
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b-2 pb-1 text-sm font-medium transition-colors ${
              isActive
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
