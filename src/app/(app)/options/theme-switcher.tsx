"use client";

import { useState, useTransition } from "react";
import { setTheme } from "./theme-actions";
import type { Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Follow system" },
];

export function ThemeSwitcher({ current }: { current: Theme }) {
  const [selected, setSelected] = useState<Theme>(current);
  const [isPending, startTransition] = useTransition();

  function apply(theme: Theme) {
    setSelected(theme);
    // Applied immediately, client-side, for instant feedback — persisted
    // to the cookie (read by the root layout on the next request) via
    // the server action below.
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    startTransition(async () => {
      await setTheme(theme);
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex gap-1 rounded-lg border border-edge bg-canvas p-1"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={selected === opt.value}
          onClick={() => apply(opt.value)}
          disabled={isPending}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            selected === opt.value
              ? "bg-surface-raised text-ink shadow-sm"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
