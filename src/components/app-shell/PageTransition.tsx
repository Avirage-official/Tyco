"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { DUR_FAST, DUR, EASE_IN_OUT, EASE_OUT } from "@/lib/motion/variants";

/**
 * A short cross-fade between routes. Deliberately no vertical movement:
 * a transform on this wrapper would become the containing block for any
 * `position: fixed` descendant (sticky bars, sheets) and pin them to the
 * page instead of the viewport.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DUR, ease: EASE_IN_OUT } }}
          exit={{ opacity: 0, transition: { duration: DUR_FAST, ease: EASE_OUT } }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
