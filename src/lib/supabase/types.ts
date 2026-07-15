import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * The Supabase client, typed against this project's actual schema.
 *
 * Use this everywhere a query helper or Server Action takes a client —
 * never the bare `SupabaseClient` from @supabase/supabase-js. That one
 * defaults its schema parameter to `any`, which silently erases every bit
 * of checking `createClient()` sets up with `createServerClient<Database>`:
 * a `.from("wallet_balnces")` typo, a column that doesn't exist, an insert
 * missing a required field — all of it compiles fine against the bare
 * type, and only fails at runtime against the real database.
 *
 * Both `createClient()` factories already return this shape; declaring
 * parameters as `TypedSupabaseClient` is what carries it through to the
 * call sites where the queries are actually written.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;
