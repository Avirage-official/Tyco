"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminNav.module.css";

const groups = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Happenings",
    items: [
      { href: "/admin/events", label: "Events" },
      { href: "/admin/tickets", label: "Tickets" },
      { href: "/admin/checkin", label: "Check-in" },
    ],
  },
  {
    label: "Membership Deals Network",
    items: [
      { href: "/admin/vendors", label: "Vendors" },
      { href: "/admin/deals", label: "Deals" },
      { href: "/admin/deal-redemptions", label: "Redemptions" },
      { href: "/admin/deal-checkins", label: "Deal check-ins" },
      { href: "/admin/vendor-payouts", label: "Vendor payouts" },
    ],
  },
  {
    label: "Shop",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/orders", label: "Orders" },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/settings", label: "Homepage" },
      { href: "/admin/portfolio", label: "Portfolio" },
      { href: "/admin/legal", label: "Legal" },
      { href: "/admin/webhooks", label: "Webhooks" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/debug", label: "Debug" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Admin sections">
      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          <p className={styles.groupLabel}>{group.label}</p>
          {group.items.map((link) => {
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
        </div>
      ))}
    </nav>
  );
}
