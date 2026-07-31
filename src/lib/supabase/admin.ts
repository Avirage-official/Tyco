import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role client — bypasses RLS entirely. Server-only, never import
 * this from a Client Component. Used by the Supabase Admin API (listing/
 * banning/deleting auth users) — every admin caller must run
 * `requireAdmin()` first — and by the checkout flow, which needs to write
 * orders for guests (no session to satisfy the customer-owned RLS policy)
 * after re-validating price and stock itself.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
