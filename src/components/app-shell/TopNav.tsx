"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Wordmark";
import { isActive, navItems } from "./nav-items";
import styles from "./TopNav.module.css";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className={styles.bar}>
      <div className={`container ${styles.inner}`}>
        <Wordmark />
        <nav className={styles.links} aria-label="Primary">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
