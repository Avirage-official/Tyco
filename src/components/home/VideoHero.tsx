"use client";

import { motion } from "motion/react";
import { fadeUpContainer, revealViewport } from "@/lib/motion/variants";
import styles from "./VideoHero.module.css";

export function VideoHero({
  size = "full",
  children,
}: {
  size?: "full" | "compact";
  children: React.ReactNode;
}) {
  return (
    <section className={`${styles.hero} ${size === "full" ? styles.full : styles.compact}`}>
      <video className={styles.heroVideo} autoPlay muted loop playsInline aria-hidden="true">
        <source src="/video/home-hero.mp4" type="video/mp4" />
      </video>
      <div className={styles.heroOverlay} aria-hidden="true" />
      <motion.div
        className={`container ${styles.heroInner}`}
        variants={fadeUpContainer}
        initial="hidden"
        whileInView="visible"
        viewport={revealViewport}
      >
        {children}
      </motion.div>
    </section>
  );
}
