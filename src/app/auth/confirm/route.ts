import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles the link in a confirmation / invite email: verifies the one-time
 * token, then forwards the user on (`next`) — e.g. an invited user to
 * /set-password.
 *
 * The session cookies that verifyOtp issues are written directly onto the
 * redirect response (the same explicit cookie-forwarding the proxy does),
 * rather than relying on next/navigation's redirect() to flush cookies from a
 * GET Route Handler — which it does not do reliably, so the session would be
 * created server-side but never reach the browser, and the invitee would land
 * on /set-password with no session and get bounced to /login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    // Build the destination response up front so the client can attach the
    // session cookies to it as verifyOtp issues them.
    const response = NextResponse.redirect(new URL(next, origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
}
