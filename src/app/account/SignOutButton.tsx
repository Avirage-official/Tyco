"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearStoredCart } from "@/lib/cart/CartContext";
import { IconArrowRight, IconLogout } from "@/components/icons";
import styles from "./page.module.css";

export function SignOutRow() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearStoredCart();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" className={`${styles.row} ${styles.rowButton}`} onClick={handleSignOut}>
      <IconLogout className={styles.rowIcon} />
      <span className={styles.rowBody}>
        <span className={styles.rowLabel}>Sign out</span>
      </span>
      <IconArrowRight className={styles.rowChevron} />
    </button>
  );
}
