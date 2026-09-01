import { VideoHero } from "@/components/home/VideoHero";
import { SwipeDashboard, type DealPreview } from "@/components/home/SwipeDashboard";
import type { ShopItem } from "@/components/home/FeaturedShop";
import type { DashboardSlideImages, DashboardSlideVisibility, EventSlide } from "@/lib/supabase/types";
import styles from "./Dashboard.module.css";

export type DashboardProps = {
  name: string;
  events: EventSlide[];
  shopItems: ShopItem[];
  deals: DealPreview[];
  slideImages: DashboardSlideImages;
  hiddenSlides: DashboardSlideVisibility;
};

export function Dashboard({
  name,
  events,
  shopItems,
  deals,
  slideImages,
  hiddenSlides,
}: DashboardProps) {
  return (
    <>
      <VideoHero size="compact">
        <p className="eyebrow">Tyco</p>
        <h1 className={styles.heroTitle}>Welcome back, {name}</h1>
        <p className={styles.heroSubtitle}>
          Apparel, deals, and real access to the studios and services
          creatives already spend on — all in one place.
        </p>
      </VideoHero>

      <SwipeDashboard
        events={events}
        shopItems={shopItems}
        deals={deals}
        slideImages={slideImages}
        hiddenSlides={hiddenSlides}
      />
    </>
  );
}
