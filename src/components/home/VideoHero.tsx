"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { fadeUpContainer } from "@/lib/motion/variants";
import styles from "./VideoHero.module.css";

const POSTER = "/video/home-hero-poster.jpg";

/**
 * The video hero. The poster is the video's own opening frame, so the
 * headline lands on an image immediately instead of on black while 16MB
 * of video downloads, and there is no jump when playback starts.
 *
 * The footage drifts up slightly as the page scrolls — the video is cut
 * taller than the section so the move never reveals an edge. Under
 * prefers-reduced-motion the video is dropped entirely and the poster
 * stands in for it (see the stylesheet).
 */
export function VideoHero({
  size = "full",
  children,
}: {
  size?: "full" | "compact";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  return (
    <section ref={ref} className={`${styles.hero} ${size === "full" ? styles.full : styles.compact}`}>
      <motion.video
        className={styles.heroVideo}
        style={{ y }}
        poster={POSTER}
        preload="metadata"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src="/video/home-hero.mp4" type="video/mp4" />
      </motion.video>
      <div className={styles.heroOverlay} aria-hidden="true" />
      <motion.div
        className={`container ${styles.heroInner}`}
        variants={fadeUpContainer}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </section>
  );
}
