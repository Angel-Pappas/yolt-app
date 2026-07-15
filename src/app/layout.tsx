import type { Metadata } from "next";
import "./globals.css";
import { getThemePreference } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Yolt-App",
  description: "Personal finance transaction tracker",
};

/**
 * Reads the theme cookie and sets data-theme on <html> during SSR — this
 * is what avoids a flash of the wrong theme on load. When the preference
 * is "system", the attribute is omitted entirely so the CSS
 * `@media (prefers-color-scheme: dark)` rule (scoped to :root:not([data-theme]))
 * is what decides, purely from the OS setting, with no JS involved.
 *
 * Reading cookies() here opts the whole app out of static rendering
 * (a few routes — /, /auth/auth-code-error — were previously static);
 * an accepted, deliberate tradeoff for correct SSR theming.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemePreference();

  return (
    <html
      lang="en"
      data-theme={theme === "system" ? undefined : theme}
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
