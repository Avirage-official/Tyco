"use client";

import { usePathname } from "next/navigation";
import styles from "./studio.module.css";

/**
 * Scopes the light orange/red + brown palette (docs/happenings-mobile-redesign.md)
 * to the /studio events route only — /studio/deals keeps the site's dark theme.
 * A client component because the light/dark decision depends on the current
 * route, and this wraps chrome shared by both routes in the layout.
 */
export function StudioThemeScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHappenings = pathname === "/studio";

  return <div className={isHappenings ? styles.happeningsTheme : undefined}>{children}</div>;
}
