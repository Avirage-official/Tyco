import { createClient } from "@/lib/supabase/server";
import { MobileTopBarNav } from "./MobileTopBarNav";

export async function MobileTopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <MobileTopBarNav signedIn={Boolean(user)} />;
}
