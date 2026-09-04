import type { Variants } from "motion/react";

const EASE = [0.4, 0, 0.2, 1] as const;

/** Stagger-orchestrates any motion children that carry `variants={fadeUpItem}`. */
export const fadeUpContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Fires as soon as an element is ~20% into the viewport, and only once. */
export const revealViewport = { once: true, amount: 0.2 } as const;
