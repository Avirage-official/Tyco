import { PageHeader } from "@/components/ui/PageHeader";
import { StudioTabs } from "./StudioTabs";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        eyebrow="Behind the sound"
        title="Happenings"
        description="The creative work in progress, and every event we've thrown or have coming up."
      />
      <div className="container">
        <StudioTabs />
        <div style={{ paddingBlock: "var(--space-lg)" }}>{children}</div>
      </div>
    </>
  );
}
