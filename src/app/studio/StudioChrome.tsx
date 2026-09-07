"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StudioSidebar } from "./StudioSidebar";
import { StudioTabs } from "./StudioTabs";
import { StudioFeatureBanner } from "./StudioFeatureBanner";
import styles from "./studio.module.css";

/**
 * Happenings (`/studio`) is a full-bleed editorial page — its own hero,
 * marquee, and poster grid fill the viewport edge to edge — so it opts out
 * of the shared dashboard shell entirely. Deals (`/studio/deals`) keeps the
 * header/sidebar/tabs/banner shell unchanged.
 */
export function StudioChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHappenings = pathname === "/studio";

  if (isHappenings) return <>{children}</>;

  return (
    <>
      <PageHeader
        eyebrow="Behind the sound"
        title="Happenings"
        description="The creative work in progress, and every event we've thrown or have coming up."
      />
      <div className={styles.shell}>
        <StudioSidebar />
        <div className={styles.shellContent}>
          <div className={styles.mobileTabs}>
            <StudioTabs />
          </div>
          <StudioFeatureBanner />
          {children}
        </div>
      </div>
    </>
  );
}
