export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Home</h1>
      <p className="text-sm text-neutral-500">
        Welcome to Yolt. Head to Transactions to log a transaction.
      </p>
    </div>
  );
}
