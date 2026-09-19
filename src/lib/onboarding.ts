import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * A purchase carries a name to the counter — it is what staff read off the
 * pass when they approve it — so buying is gated on the welcome step the
 * same way the account area is. Browsing is not.
 *
 * Takes the session client rather than the admin one: this must be the
 * member's own row, read under their own RLS.
 */
export async function requireOnboarded(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.onboarded_at) {
    throw new Error(`Finish setting up your account before you ${action}.`);
  }
}
