import { CartLink } from "@/components/cart/CartLink";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "./Wordmark";
import { NavLinks } from "./NavLinks";
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
        <NavLinks />
        <span className={styles.spacer} />
        {user && <TopNavSignOut />}
        <CartLink />
      </div>
    </header>
  );
}
