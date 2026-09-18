"use client";

import { motion } from "motion/react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import styles from "./DiscoveryRow.module.css";

/**
 * A titled row of cards on the homepage — the deals and events a visitor
 * sees before they have signed up. The heading and then each card fade up
 * in turn as the row scrolls into view; the cards carry `fadeUpItem`
 * themselves, so any shared Card works here.
 */
export function DiscoveryRow({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <motion.section
      className={`container container--wide ${styles.section}`}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div variants={fadeUpItem}>
        <SectionHeader title={title} description={description} action={action} />
      </motion.div>
      <motion.div className={styles.grid}>{children}</motion.div>
    </motion.section>
  );
}
