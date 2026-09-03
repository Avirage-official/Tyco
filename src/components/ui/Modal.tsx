"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "@/components/icons";
import styles from "./Modal.module.css";

// Client-only mount detection without an effect-driven setState (which
// trips react-hooks/set-state-in-effect) — same pattern as
// MobileBookingBar. getServerSnapshot returns false so SSR and the first
// client render agree (both render nothing), then useSyncExternalStore
// itself forces the reconciling re-render once real client state (true)
// is available, after hydration.
function subscribeNoop() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

/**
 * Generic dialog shell built on the native <dialog> element — gets focus
 * trapping, Escape-to-close, and top-layer stacking for free. Portaled to
 * document.body rather than rendered where it's used: a card grid that
 * relies on :nth-child for layout (the deals poster grid does) would have
 * its column counting thrown off by an inline <dialog> sibling, and a
 * portal sidesteps that entirely rather than relying on the (currently
 * true, but fragile to depend on) top-layer exemption from ancestor
 * transforms — same reasoning as MobileBookingBar elsewhere in /studio.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // mounted is a dependency (not just read) because the dialog only
    // exists in the DOM — and ref only attaches — once mounted flips true.
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        <IconClose />
      </button>
      <div className={styles.content}>{children}</div>
    </dialog>,
    document.body
  );
}
