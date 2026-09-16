"use client";

import { createPortal } from "react-dom";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import styles from "./StickyBar.module.css";

const DOCK_QUERY = "(max-width: 759px)";

/**
 * The fixed booking / redeem bar on mobile detail pages. Below the dock
 * breakpoint it portals to document.body and pins to the bottom of the
 * viewport (escaping the page-transition wrapper, which would otherwise
 * become its containing block). Above it, children render inline, so the
 * desktop layout can put them in a sticky side card instead.
 *
 * `spacer` reserves the bar's height at the end of the page content on
 * mobile so nothing is hidden behind it.
 */
export function StickyBar({ children }: { children: React.ReactNode }) {
  const docked = useMediaQuery(DOCK_QUERY);

  if (!docked) return <>{children}</>;
  return createPortal(
    <div className={styles.bar} role="region" aria-label="Actions">
      {children}
    </div>,
    document.body
  );
}

export function StickyBarSpacer() {
  return <div className={styles.spacer} aria-hidden />;
}
