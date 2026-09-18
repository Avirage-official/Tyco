"use client";

import { motion, useScroll, useTransform } from "motion/react";

/**
 * The detail-page hero: the only scroll-linked motion in the system. The
 * media is scaled up slightly and drifts down by at most 5% of its height
 * over the first 800px of scroll, so it never reveals an edge. The root
 * MotionConfig turns this off under prefers-reduced-motion.
 */
export function ParallaxMedia({ className, children }: { className?: string; children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], ["0%", "5%"]);

  return (
    <div className={className} style={{ overflow: "hidden" }}>
      <motion.div style={{ y, scale: 1.1, height: "100%" }}>{children}</motion.div>
    </div>
  );
}
