import { redirect } from "next/navigation";

// Public signup is closed — the app is invite-only (admins add users). Kept as
// a redirect so any old /signup link lands on the login page.
export default function SignupClosedRedirect() {
  redirect("/login");
}
