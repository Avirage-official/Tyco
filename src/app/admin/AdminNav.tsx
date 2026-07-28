"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminNav.module.css";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/artists", label: "Artists" },
  { href: "/admin/albums", label: "Albums" },
  { href: "/admin/tracks", label: "Tracks" },
  { href: "/admin/portfolio", label: "Portfolio" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Admin sections">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
