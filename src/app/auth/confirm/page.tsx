"use client";

import { useEffect, useState } from "react";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Confirmation / invite link handler.
 *
 * Supabase's default (non-custom-SMTP) email templates can't be edited, so the
 * invite link routes through Supabase's own /auth/v1/verify endpoint, which
 * uses the *implicit* flow: on success it redirects here with the session in
 * the URL **fragment** (`#access_token=…&refresh_token=…`), and on failure with
 * `#error=…`. A fragment is never sent to the server, so this must run on the
 * client to read it. We establish the session (which writes the auth cookies),
 * then do a full navigation to `next` so the server sees the session — e.g. an
 * invited user lands on /set-password with a live session instead of being
 * bounced to /login.
 *
 * Also still supports the `?token_hash=…&type=…` query format, in case a custom
 * SMTP + token_hash template is configured later.
 */
export default function ConfirmPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Capture the URL parts up front, before creating the client (whose own
    // detectSessionInUrl may rewrite the address bar).
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const rawNext = url.searchParams.get("next") ?? "/";
    // Only allow same-site relative paths — never an attacker-supplied absolute
    // URL (open-redirect guard).
    const next =
      rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

    function fail() {
      window.location.replace("/auth/auth-code-error");
    }

    async function run() {
      // The link was expired/invalid — Supabase reports it in the fragment.
      if (hashParams.get("error")) {
        fail();
        return;
      }

      const supabase = createClient();

      // Implicit flow: session tokens arrive in the URL fragment.
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          fail();
          return;
        }
        window.location.replace(next);
        return;
      }

      // token_hash flow (custom SMTP template): verify on the client.
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type") as EmailOtpType | null;
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        if (error) {
          fail();
          return;
        }
        window.location.replace(next);
        return;
      }

      // Nothing usable in the URL.
      fail();
    }

    run().catch(() => {
      setFailed(true);
    });
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm space-y-6">
        <span className="block text-center font-display text-2xl font-bold text-ink">
          Yolt-App
        </span>
        <div className="space-y-3 rounded-xl border border-edge bg-surface p-6 text-center shadow-[var(--shadow-card)]">
          <h1 className="font-display text-lg font-semibold text-ink">
            {failed ? "Confirmation link invalid" : "Finishing sign-in…"}
          </h1>
          <p className="text-sm text-ink-muted">
            {failed
              ? "This link has expired or was already used."
              : "One moment while we verify your link."}
          </p>
        </div>
      </div>
    </div>
  );
}
