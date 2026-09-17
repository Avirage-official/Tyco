"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { IconClose } from "@/components/icons";
import { useIsMobile, useMounted } from "@/lib/hooks/useMediaQuery";
import { DUR, DUR_FAST, DUR_SLOW, EASE_IN_OUT, EASE_OUT } from "@/lib/motion/variants";
import styles from "./Sheet.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A secondary-flow surface: a bottom sheet on mobile, a right-side panel
 * on desktop. Use it for confirmations and short forms that sit on top of
 * a page (ticket terms, sign-in prompts), not for primary content — that
 * gets its own route.
 *
 * Portaled to document.body so the page transition wrapper can't become
 * its containing block. Traps focus while open, closes on Escape and on
 * backdrop click, and restores focus to the opener on close.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  side = "auto",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Pinned to the bottom of the panel; usually the confirm button. */
  footer?: React.ReactNode;
  /** "auto": bottom sheet on mobile, right panel on desktop. "right": right panel at every width (the nav menu). */
  side?: "auto" | "right";
}) {
  const mounted = useMounted();
  const isMobile = useIsMobile();
  const fromRight = side === "right" || !isMobile;
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const panelMotion = !fromRight
    ? {
        initial: { y: "100%" },
        animate: { y: 0, transition: { duration: DUR_SLOW, ease: EASE_IN_OUT } },
        exit: { y: "100%", transition: { duration: DUR, ease: EASE_OUT } },
      }
    : {
        initial: { x: "100%" },
        animate: { x: 0, transition: { duration: DUR_SLOW, ease: EASE_IN_OUT } },
        exit: { x: "100%", transition: { duration: DUR, ease: EASE_OUT } },
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={fromRight ? `${styles.backdrop} ${styles.backdropRight}` : styles.backdrop}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DUR, ease: EASE_IN_OUT } }}
          exit={{ opacity: 0, transition: { duration: DUR_FAST, ease: EASE_OUT } }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={fromRight ? `${styles.panel} ${styles.panelRight}` : styles.panel}
            onClick={(e) => e.stopPropagation()}
            {...panelMotion}
          >
            <span className={styles.handle} aria-hidden />
            <header className={styles.header}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
                <IconClose />
              </button>
            </header>
            <div className={styles.body}>{children}</div>
            {footer && <footer className={styles.footer}>{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
