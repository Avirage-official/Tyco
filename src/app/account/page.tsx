import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";
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
      <PageHeader eyebrow="Your account" title="Account" />
      <div className={`container ${styles.wrap}`}>
        <div className={styles.row}>
          <div className={styles.avatar} aria-hidden>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p>{name}</p>
            <p className={styles.email}>{user.email}</p>
          </div>
        </div>
        {isAdmin && (
          <p style={{ marginBottom: "var(--space-md)" }}>
            <Link href="/admin" className="eyebrow">
              Go to admin →
            </Link>
          </p>
        )}
        <SignOutButton />
      </div>
    </>
  );
}
