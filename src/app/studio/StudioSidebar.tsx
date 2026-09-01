"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMark, IconTag } from "@/components/icons";
import styles from "./StudioSidebar.module.css";

const items = [
  { href: "/studio", label: "Happenings", icon: IconMark },
  { href: "/studio/deals", label: "Deals", icon: IconTag },
];

export function StudioSidebar() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar} aria-label="Happenings sections">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active}
            className={styles.item}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={styles.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
