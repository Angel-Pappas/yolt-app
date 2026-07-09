export default function HomePage() {
  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-3 p-6">
      <h1 className="font-display text-3xl font-bold text-ink">Home</h1>
      <p className="text-sm text-ink-muted">
        Welcome to Yolt-App. Head to Transactions to log a transaction.
      </p>
    </div>
  );
}
