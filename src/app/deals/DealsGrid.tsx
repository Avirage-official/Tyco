"use client";

import { motion } from "motion/react";
import { fadeUpContainer, revealViewport } from "@/lib/motion/variants";
import type { DealSummary } from "@/lib/deals/catalog";
import { DealCard } from "./DealCard";
import styles from "./deals.module.css";

/** A responsive grid of deal cards that stagger in as it scrolls into view. */
export function DealsGrid({ deals }: { deals: DealSummary[] }) {
  return (
    <motion.div
      className={styles.grid}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </motion.div>
  );
}
