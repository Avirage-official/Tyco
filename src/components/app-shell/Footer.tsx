import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "./Wordmark";
import styles from "./Footer.module.css";

const ALL_EXPLORE_LINKS = [
  { href: "/studio", label: "Happenings", navKey: "happenings" as const },
  { href: "/journal", label: "Journal", navKey: "journal" as const },
  { href: "/shop", label: "Shop", navKey: "shop" as const },
  { href: "/about", label: "About", navKey: "about" as const },
];

const accountLinks = [
  { href: "/account", label: "Your account" },
  { href: "/account/orders", label: "Your orders" },
  { href: "/account/tickets", label: "Your tickets" },
  { href: "/account/deals", label: "Your deals" },
];

export async function Footer() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("nav_hidden_items")
    .eq("id", true)
    .maybeSingle();
  const hidden = settings?.nav_hidden_items ?? {};
  const exploreLinks = ALL_EXPLORE_LINKS.filter((item) => !hidden[item.navKey]);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <p className={styles.statement}>
          Sound, style, and culture — <em>from one house</em>.
        </p>
      </div>

      <div className={`container ${styles.inner}`}>
        <div className={styles.meta}>
          <Wordmark />
          <p className={styles.coord}>Singapore &middot; Est. 2024</p>
        </div>

        <div className={styles.columns}>
          <nav className={styles.col} aria-label="Explore">
            <p className={styles.colLabel}>Explore</p>
            {exploreLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <nav className={styles.col} aria-label="Account">
            <p className={styles.colLabel}>Account</p>
            {accountLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p className={styles.copyright}>&copy; {new Date().getFullYear()} Tyco. All rights reserved.</p>
        <Link href="/terms" className={styles.legal}>
          Terms &amp; Conditions
        </Link>
      </div>
    </footer>
  );
}
