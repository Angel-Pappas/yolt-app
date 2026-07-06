import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold">Confirmation link invalid</h1>
        <p className="text-sm text-neutral-500">
          This link has expired or was already used.
        </p>
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </div>
    </div>
  );
}
