import Link from "next/link";
import { CartLink } from "@/components/cart/CartLink";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "./Wordmark";
import { DesktopNav } from "./DesktopNav";
import styles from "./TopNav.module.css";

export async function TopNav() {
  const supabase = await createClient();
  const [{ data: { user } }, { data: settings }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("site_settings").select("nav_hidden_items").eq("id", true).maybeSingle(),
  ]);

  return (
    <header className={styles.bar}>
      <div className={`container ${styles.inner}`}>
        <Wordmark />
        <DesktopNav signedIn={Boolean(user)} hiddenItems={settings?.nav_hidden_items ?? {}} />
        <span className={styles.spacer} />
        {!user && (
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.link}>
              Login
            </Link>
            <Link href="/signup" className={`${styles.link} ${styles.signup}`}>
              Sign up
            </Link>
          </div>
        )}
        <CartLink />
      </div>
    </header>
  );
}
