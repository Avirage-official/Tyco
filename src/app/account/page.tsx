import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { IconArrowRight, IconBag, IconShield, IconTicket } from "@/components/icons";
import { SignOutRow } from "./SignOutButton";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "you";
  const { data: isAdmin } = await supabase.rpc("is_admin");

  return (
    <>
      <PageHeader eyebrow="Your account" title={`Hi, ${name}`} />
      <div className={`container ${styles.wrap}`}>
        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={styles.name}>{name}</p>
            <p className={styles.email}>{user.email}</p>
          </div>
        </div>

        <div className={styles.hub}>
          <Link href="/account/orders" className={styles.row}>
            <IconBag className={styles.rowIcon} />
            <span className={styles.rowBody}>
              <span className={styles.rowLabel}>Order status</span>
              <span className={styles.rowDesc}>Track and review what you&rsquo;ve bought</span>
            </span>
            <IconArrowRight className={styles.rowChevron} />
          </Link>

          <Link href="/account/tickets" className={styles.row}>
            <IconTicket className={styles.rowIcon} />
            <span className={styles.rowBody}>
              <span className={styles.rowLabel}>Your tickets</span>
              <span className={styles.rowDesc}>Show these at the door</span>
            </span>
            <IconArrowRight className={styles.rowChevron} />
          </Link>

          {isAdmin && (
            <Link href="/admin" className={styles.row}>
              <IconShield className={styles.rowIcon} />
              <span className={styles.rowBody}>
                <span className={styles.rowLabel}>Admin</span>
                <span className={styles.rowDesc}>Manage the site</span>
              </span>
              <IconArrowRight className={styles.rowChevron} />
            </Link>
          )}

          <SignOutRow />
        </div>
      </div>
    </>
  );
}
