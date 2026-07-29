"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reads a media query as React state.
 *
 * `matchMedia` is an external system that doesn't exist during SSR, so this is
 * the same shape as the store in `/design`'s contrast table:
 * `useSyncExternalStore` with an explicit server snapshot. The server snapshot
 * is `false` — mobile-first, so the first paint matches the base breakpoint and
 * larger viewports adjust after hydration rather than the reverse.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
