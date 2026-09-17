import Link from "next/link";
import type { NavHiddenItems } from "@/lib/supabase/types";
import { Wordmark } from "./Wordmark";
import { accountNav, primaryNav, visibleNavItems } from "./nav-items";
import styles from "./Footer.module.css";

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function Footer({ hiddenItems }: { hiddenItems: NavHiddenItems }) {
  const exploreLinks = visibleNavItems(primaryNav, hiddenItems).filter((item) => item.href !== "/about");

  const columns = [
    { label: "Explore", links: exploreLinks },
    { label: "Account", links: accountNav },
    { label: "Company", links: companyLinks },
  ];

  return (
    <footer className={styles.footer}>
      <div className={`container container--wide ${styles.inner}`}>
        <div className={styles.brand}>
          <Wordmark />
          <p className={styles.tagline}>Deals, happenings and merch for the creative scene in Singapore.</p>
        </div>

        <div className={styles.columns}>
          {columns.map((col) => (
            <nav key={col.label} className={styles.col} aria-label={col.label}>
              <p className={styles.colLabel}>{col.label}</p>
              {col.links.map((link) => (
                <Link key={link.href} href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>

      <div className={`container container--wide ${styles.bottom}`}>
        <p>&copy; {new Date().getFullYear()} Tyco. All rights reserved.</p>
        <p>Singapore</p>
      </div>
    </footer>
  );
}
