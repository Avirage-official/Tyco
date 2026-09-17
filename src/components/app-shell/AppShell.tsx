import { CartProvider } from "@/lib/cart/CartContext";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "./SiteHeader";
import { MobileHeader } from "./MobileHeader";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import styles from "./AppShell.module.css";

/**
 * Fetches the shell's data once per request — who is signed in and which
 * sections an admin has hidden — and hands it to the desktop header, the
 * mobile header and the footer, which are plain components.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: settings },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("site_settings").select("nav_hidden_items").eq("id", true).maybeSingle(),
  ]);

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? user.email?.split("@")[0] ?? null;
  }

  const shell = {
    signedIn: Boolean(user),
    displayName,
    hiddenItems: settings?.nav_hidden_items ?? {},
  };

  return (
    <CartProvider>
      <SiteHeader {...shell} />
      <MobileHeader {...shell} />
      <main className={styles.main}>
        <PageTransition>{children}</PageTransition>
        <Footer hiddenItems={shell.hiddenItems} />
      </main>
    </CartProvider>
  );
}
