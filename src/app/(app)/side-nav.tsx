"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Transactions" },
  { href: "/entities", label: "Entities" },
  { href: "/wallets", label: "Wallets" },
  { href: "/taxes", label: "Taxes" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-edge bg-surface p-4">
      <nav className="flex flex-col gap-1">
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
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-soft font-semibold text-accent"
                  : "text-ink-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
