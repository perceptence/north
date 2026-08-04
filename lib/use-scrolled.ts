"use client";

import { useEffect, useState } from "react";

/**
 * Whether the window has moved off the top.
 *
 * One job, one definition. `AppBar` had this inline and the product shell's
 * apron needs exactly the same answer, and two copies of a scroll listener is
 * how two pieces of chrome end up disagreeing about whether the page has
 * moved.
 *
 * The threshold is a few pixels rather than zero: rubber-band scrolling and a
 * restored scroll position both land at 1–2px often enough that `> 0` makes
 * an edge flicker on a page nobody has touched.
 *
 * `passive` because this never calls `preventDefault`, and a non-passive
 * scroll listener blocks the compositor on every frame of a flick.
 */
export function useScrolled(threshold = 4): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    // Read once on mount: a page restored mid-scroll is already past it.
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
