"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { signOut } from "@/lib/auth/signOut";
import { DUR, DUR_FAST, EASE_IN_OUT, EASE_OUT } from "@/lib/motion/variants";
import { accountNav } from "./nav-items";
import styles from "./AccountMenu.module.css";

/**
 * The signed-in avatar button and its dropdown: the user's own pages and
 * Sign out. Closes on outside click, Escape, and navigation.
 */
export function AccountMenu({ displayName }: { displayName: string | null }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();

  // Close on navigation. Adjusting state during render avoids an extra
  // effect-driven render pass.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  const initial = (displayName ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={displayName ? `Account menu for ${displayName}` : "Account menu"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.avatar} aria-hidden>
          {initial}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            className={styles.panel}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: DUR, ease: EASE_IN_OUT } }}
            exit={{ opacity: 0, y: -6, transition: { duration: DUR_FAST, ease: EASE_OUT } }}
          >
            {displayName && <p className={styles.name}>{displayName}</p>}
            {accountNav.map((item) => (
              <Link key={item.href} href={item.href} role="menuitem" className={styles.item}>
                {item.label}
              </Link>
            ))}
            <span className={styles.divider} aria-hidden />
            <button type="button" role="menuitem" className={styles.item} onClick={handleSignOut}>
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
