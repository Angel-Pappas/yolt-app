import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * The Supabase ADMIN client — authenticated with the service-role key, which
 * bypasses RLS and can manage auth users. This is the most privileged
 * credential in the app.
 *
 * `import "server-only"` makes it a hard build error to import this into any
 * client component, so the key can never reach the browser. Use it only from
 * server code that genuinely needs admin powers (user invites/management), and
 * always behind an is-admin guard — never expose its capabilities to a normal
 * request path.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
