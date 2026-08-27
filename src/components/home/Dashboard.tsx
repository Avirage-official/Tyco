import { VideoHero } from "@/components/home/VideoHero";
import { SwipeDashboard, type CreatorPreview } from "@/components/home/SwipeDashboard";
import type { ShopItem } from "@/components/home/FeaturedShop";
import type { DashboardSlideImages, EventSlide } from "@/lib/supabase/types";
import styles from "./Dashboard.module.css";

export type DashboardProps = {
  name: string;
  events: EventSlide[];
  shopItems: ShopItem[];
  creators: CreatorPreview[];
  slideImages: DashboardSlideImages;
};

export function Dashboard({ name, events, shopItems, creators, slideImages }: DashboardProps) {
  return (
    <>
      <VideoHero size="compact">
        <p className="eyebrow">Tyco</p>
        <h1 className={styles.heroTitle}>Welcome back, {name}</h1>
      </VideoHero>

      <SwipeDashboard events={events} shopItems={shopItems} creators={creators} slideImages={slideImages} />
    </>
  );
}
