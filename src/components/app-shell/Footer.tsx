import Link from "next/link";
import { Wordmark } from "./Wordmark";
import styles from "./Footer.module.css";

const links = [
  { href: "/creators", label: "Creators" },
  { href: "/studio", label: "Happenings" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/account", label: "Your account" },
  { href: "/account/orders", label: "Your orders" },
  { href: "/account/tickets", label: "Your tickets" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.meta}>
          <Wordmark />
          <p className={styles.tagline}>Sound, story, and cloth — one house.</p>
          <p className={styles.copyright}>&copy; {new Date().getFullYear()} Tyco. All rights reserved.</p>
        </div>
        <nav className={styles.links} aria-label="Footer">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
