"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

/** True once the window has scrolled more than `px` down. False during SSR. */
export function useScrolledPast(px: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.scrollY > px,
    () => false
  );
}
