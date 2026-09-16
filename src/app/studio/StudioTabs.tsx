"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavHiddenItems } from "@/lib/supabase/types";
import styles from "./StudioTabs.module.css";

const tabs = [
  { href: "/studio", label: "Happenings", navKey: "happenings" as const },
  { href: "/studio/deals", label: "Deals", navKey: "deals" as const },
];

export function StudioTabs({ hiddenNavItems = {} }: { hiddenNavItems?: NavHiddenItems }) {
  const pathname = usePathname();
  // Happenings and Deals are independent top-level nav sections now — if an
  // admin hides one from the main nav, it shouldn't still be reachable via
  // this pill on the other one.
  const visibleTabs = tabs.filter((tab) => !hiddenNavItems[tab.navKey]);

  return (
    <nav aria-label="Happenings sections" className={styles.tabs}>
      {visibleTabs.map((tab) => {
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
