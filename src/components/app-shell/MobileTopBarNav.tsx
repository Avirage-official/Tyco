"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Wordmark } from "./Wordmark";
import { CartLink } from "@/components/cart/CartLink";
import { navItems, visibleNavItems, isActive } from "./nav-items";
import { IconMenu, IconClose } from "@/components/icons";
import type { NavHiddenItems } from "@/lib/supabase/types";
import styles from "./MobileTopBar.module.css";

/**
 * The site's mobile nav: a compact app-style top bar whose menu button
 * opens a dropdown sheet, rather than a horizontal link row or a separate
 * bottom tab bar (the two used to coexist, which read as two navs for one
 * site). TopNav (the desktop link rail) takes over above the breakpoint
 * this hides at.
 *
 * Takes `hiddenItems` (plain booleans) rather than a pre-filtered item
 * list — navItems carries icon component references, and passing those
 * through a Server Component prop isn't serializable across the RSC
 * boundary. Filtering happens here instead, against the statically
 * imported navItems this Client Component already has in its own bundle.
 */
export function MobileTopBarNav({
  signedIn,
  hiddenItems = {},
}: {
  signedIn: boolean;
  hiddenItems?: NavHiddenItems;
}) {
  const items = visibleNavItems(navItems, hiddenItems);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the sheet on navigation. Adjusting state during render (rather
  // than in an effect) avoids an extra cascading render pass — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose className={styles.icon} /> : <IconMenu className={styles.icon} />}
        </button>
        <Wordmark />
        <CartLink className={styles.cart} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.backdrop}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.nav
              aria-label="Primary"
              className={styles.sheet}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            >
              {items.map((item) => {
                const active = isActive(pathname, item.href, item.match);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? `${styles.sheetLink} ${styles.sheetLinkActive}` : styles.sheetLink}
                  >
                    <Icon className={styles.sheetIcon} />
                    {item.label}
                  </Link>
                );
              })}
              {!signedIn && (
                <>
                  <span className={styles.sheetDivider} aria-hidden />
                  <Link href="/login" className={styles.sheetLink}>
                    Login
                  </Link>
                  <Link href="/signup" className={`${styles.sheetLink} ${styles.sheetLinkAccent}`}>
                    Sign up
                  </Link>
                </>
              )}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
