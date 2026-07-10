import { getThemePreference } from "@/lib/theme";
import { ThemeSwitcher } from "./theme-switcher";

const cardClass =
  "space-y-4 rounded-xl border border-edge bg-surface p-5 shadow-[var(--shadow-card)]";
const sectionTitleClass = "font-display text-lg font-semibold text-ink";

export default async function OptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const message = typeof rawParams.message === "string" ? rawParams.message : undefined;
  const theme = await getThemePreference();

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="font-display text-3xl font-bold text-ink">Options</h1>

      {message && (
        <p className="rounded-lg border border-edge bg-accent-soft px-4 py-2.5 text-sm text-ink">
          {message}
        </p>
      )}

      <section className={cardClass}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleClass}>Appearance</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-ink-muted">
            Choose how Yolt-App looks on this device.
          </p>
          <ThemeSwitcher current={theme} />
        </div>
      </section>
    </div>
  );
}
