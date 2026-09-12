import { createClient } from "@/lib/supabase/server";
import { MobileTopBarNav } from "./MobileTopBarNav";

export async function MobileTopBar() {
  const supabase = await createClient();
  const [{ data: { user } }, { data: settings }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("site_settings").select("nav_hidden_items").eq("id", true).maybeSingle(),
  ]);

  return <MobileTopBarNav signedIn={Boolean(user)} hiddenItems={settings?.nav_hidden_items ?? {}} />;
}
