"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a media query without an effect-driven setState. The
 * server snapshot is always `false`, so SSR and the first client render
 * agree, then useSyncExternalStore reconciles to the real viewport
 * reading right after hydration without a mismatch.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** Below the desktop breakpoint used by the shell (see TopNav / MobileTopBar). */
export const MOBILE_QUERY = "(max-width: 859px)";

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}

/** Client-only mount flag with the same no-mismatch guarantee. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
