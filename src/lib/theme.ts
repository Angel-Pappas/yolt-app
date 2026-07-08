import { cookies } from "next/headers";

export type Theme = "light" | "dark" | "system";
export const THEME_COOKIE = "yolt-theme";

function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** Reads the user's theme preference from the cookie, server-side, so the root layout can set data-theme before first paint (no flash of the wrong theme). */
export async function getThemePreference(): Promise<Theme> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(THEME_COOKIE)?.value;
  return isTheme(raw) ? raw : "system";
}
