import Link from "next/link";
import { Wordmark } from "./Wordmark";
import styles from "./Footer.module.css";

const exploreLinks = [
  { href: "/studio", label: "Happenings" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];

const accountLinks = [
  { href: "/account", label: "Your account" },
  { href: "/account/orders", label: "Your orders" },
  { href: "/account/tickets", label: "Your tickets" },
];

export function Footer() {
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
