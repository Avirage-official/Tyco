"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const QUERY = "(max-width: 759px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Docks its children to the bottom of the screen on mobile via a portal to
 * document.body. Needed because the site's page-enter transition wraps all
 * route content in an element with a CSS transform, which creates a new
 * containing block for any `position: fixed` descendant — silently turning
 * "fixed to the viewport" into "fixed to that wrapper" instead. Escaping via
 * portal sidesteps that entirely, the same way the site's own BottomNav
 * (rendered outside the transitioning tree) already does.
 *
 * Renders inline (no portal) on desktop and during SSR — getServerSnapshot
 * returns false, matching the server-rendered markup exactly, then
 * useSyncExternalStore corrects to the real viewport reading right after
 * hydration without a mismatch.
 */
export function MobileBookingBar({ children }: { children: React.ReactNode }) {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isMobile) return <>{children}</>;
  return createPortal(children, document.body);
}
