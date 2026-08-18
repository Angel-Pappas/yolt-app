import { redirect } from "next/navigation";

// The Lists section moved into Settings (2026-08). Kept as a redirect so old
// links/bookmarks still land somewhere sensible.
export default function ListsRedirect() {
  redirect("/settings/categories");
}
