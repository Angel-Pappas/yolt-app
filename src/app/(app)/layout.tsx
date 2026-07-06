import Link from "next/link";
import { logout } from "@/app/auth/actions";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <nav className="mx-auto flex w-full max-w-2xl items-center justify-between p-4 text-sm">
          <div className="flex gap-4">
            <Link href="/" className="font-semibold">
              Home
            </Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/options">Options</Link>
          </div>
          <form action={logout}>
            <button type="submit" className="underline">
              Log out
            </button>
          </form>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
