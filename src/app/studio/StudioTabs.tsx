"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./StudioTabs.module.css";

const tabs = [
  { href: "/studio", label: "Work" },
  { href: "/studio/events", label: "Events" },
];

export function StudioTabs() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabs} aria-label="Studio sections">
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
