import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate for every admin page and server action. Re-checks on the server
 * every time rather than trusting anything the client sends — the
 * `admins` table has no client policies at all, so `is_admin()` is the
 * only way to answer "is this session allowed to do this", and it must
 * be asked fresh, not cached client-side.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    redirect("/?admin=denied");
  }

  return { supabase, user };
}
