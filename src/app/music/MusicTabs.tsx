"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MusicTabs.module.css";

const tabs = [
  { href: "/music", label: "Browse" },
  { href: "/music/library", label: "Library" },
];

export function MusicTabs() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabs} aria-label="Music sections">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
