import type { Transition, Variants } from "motion/react";

/**
 * The shared motion vocabulary. Every page and component composes from
 * these rather than defining its own durations or easings — see
 * docs/design-system.md §8.
 */

export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;
export const EASE_OUT = [0.4, 0, 1, 1] as const;

export const DUR_FAST = 0.15;
export const DUR = 0.22;
export const DUR_SLOW = 0.3;

/** Spring reserved for taps and toggles. Never for layout. */
export const pressSpring: Transition = { type: "spring", stiffness: 420, damping: 30 };

/** Stagger-orchestrates any motion children that carry `variants={fadeUpItem}`. */
export const fadeUpContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR, ease: EASE_IN_OUT } },
};

/** Opacity-only enter/exit, for sheets, menus, and overlays. */
export const fade: Variants = {
  hidden: { opacity: 0, transition: { duration: DUR_FAST, ease: EASE_OUT } },
  visible: { opacity: 1, transition: { duration: DUR, ease: EASE_IN_OUT } },
};

/** Fires as soon as an element is ~15% into the viewport, and only once. */
export const revealViewport = { once: true, amount: 0.15 } as const;
