import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The welcome step is required before the account area and before buying,
 * not before browsing. Both the sign-in form and the OAuth callback land on
 * /account, so this catches a new member immediately — while someone who
 * wanders into /deals first is left alone to look around, which is how
 * marketplaces normally handle it.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Faccount");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) redirect("/welcome");

  return <>{children}</>;
}
