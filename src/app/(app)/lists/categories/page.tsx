import { redirect } from "next/navigation";

// Moved to /settings/categories (2026-08). Redirect kept for old links.
export default function CategoriesRedirect() {
  redirect("/settings/categories");
}
