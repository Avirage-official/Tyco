"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, navItems } from "./nav-items";
import styles from "./BottomNav.module.css";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bar} aria-label="Primary">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href, item.match);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={styles.icon} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
