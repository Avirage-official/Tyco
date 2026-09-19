import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeFlow } from "./WelcomeFlow";
import styles from "./welcome.module.css";

export const metadata: Metadata = { title: "Welcome" };

/**
 * Three questions, one per screen — the shape Airbnb's host onboarding and
 * Typeform both settled on, because a question given a whole screen can be
 * asked as a sentence instead of shrunk to a grey label above a box.
 *
 * The photograph is the anchor: it holds still on the right while the
 * question column travels, which is what makes three screens read as one
 * flow rather than three page loads.
 */
export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fwelcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  // Already been through it — there is nothing to ask.
  if (profile?.onboarded_at) redirect("/account");

  return (
    <div className={styles.split}>
      <div className={styles.column}>
        <WelcomeFlow initialName={profile?.display_name ?? ""} />
      </div>

      <aside className={styles.panel} aria-hidden>
        <Image
          src="/onboarding/welcome.jpg"
          alt=""
          fill
          sizes="(min-width: 900px) 50vw, 100vw"
          priority
          className={styles.panelImage}
        />
        <span className={styles.panelScrim} />
      </aside>
    </div>
  );
}
