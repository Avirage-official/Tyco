"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconArrowRight, IconLogout } from "@/components/icons";
import styles from "./page.module.css";

export function SignOutRow() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
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
