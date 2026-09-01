import { PageHeader } from "@/components/ui/PageHeader";
import { StudioSidebar } from "./StudioSidebar";
import { StudioTabs } from "./StudioTabs";
import styles from "./studio.module.css";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
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
          {children}
        </div>
      </div>
    </>
  );
}
