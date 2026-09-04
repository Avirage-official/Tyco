"use client";

import { motion } from "motion/react";
import { VideoHero } from "@/components/home/VideoHero";
import { SwipeDashboard, type DealPreview } from "@/components/home/SwipeDashboard";
import type { ShopItem } from "@/components/home/FeaturedShop";
import { fadeUpItem } from "@/lib/motion/variants";
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
        <motion.p className="eyebrow" variants={fadeUpItem}>
          Tyco
        </motion.p>
        <motion.h1 className={styles.heroTitle} variants={fadeUpItem}>
          Welcome back, {name}
        </motion.h1>
        <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
          Apparel, deals, and real access to the studios and services
          creatives already spend on — all in one place.
        </motion.p>
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
