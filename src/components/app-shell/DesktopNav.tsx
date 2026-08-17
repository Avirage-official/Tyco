"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, navItems } from "./nav-items";
import styles from "./TopNav.module.css";

const menuItems = navItems.filter((item) => item.href !== "/");

export function DesktopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const menuActive = menuItems.some((item) => isActive(pathname, item.href, item.match));
  const aboutActive = pathname === "/about";

  return (
    <nav className={styles.links} aria-label="Primary">
      <div ref={rootRef} className={styles.menuRoot}>
        <button
          type="button"
          className={menuActive ? `${styles.link} ${styles.linkActive}` : styles.link}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
        {open && (
          <div className={styles.menuPanel} role="menu">
            {menuItems.map((item) => {
              const active = isActive(pathname, item.href, item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={active ? `${styles.menuPanelLink} ${styles.menuPanelLinkActive}` : styles.menuPanelLink}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/about"
        className={aboutActive ? `${styles.link} ${styles.linkActive}` : styles.link}
        aria-current={aboutActive ? "page" : undefined}
      >
        About
      </Link>
    </nav>
  );
}
