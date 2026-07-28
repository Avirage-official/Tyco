import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role client — bypasses RLS entirely. Server-only, never import
 * this from a Client Component. It exists solely for the Supabase Admin
 * API (listing/banning/deleting auth users), which has no RLS-based
 * equivalent. Every caller must run `requireAdmin()` first.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
