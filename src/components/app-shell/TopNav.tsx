import Link from "next/link";
import { CartLink } from "@/components/cart/CartLink";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "./Wordmark";
import { DesktopNav } from "./DesktopNav";
import { TopNavSignOut } from "./TopNavSignOut";
import styles from "./TopNav.module.css";

export async function TopNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className={styles.bar}>
      <div className={`container ${styles.inner}`}>
        <Wordmark />
        <DesktopNav />
        <span className={styles.spacer} />
        {user ? (
          <TopNavSignOut />
        ) : (
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.link}>
              Login
            </Link>
            <Link href="/signup" className={styles.link}>
              Sign up
            </Link>
          </div>
        )}
        <CartLink />
      </div>
    </header>
  );
}
