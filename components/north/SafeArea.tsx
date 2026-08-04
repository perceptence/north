"use client";

import { useEffect } from "react";

/**
 * Hands the device's top inset to the app when the OS cannot.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * On hardware, `--safe-top` resolves through `env(safe-area-inset-top)` and
 * nothing here is needed. Inside /preview it cannot: an iframe has no notch,
 * so `env()` is 0 no matter what the frame around it is drawing.
 *
 * The preview used to compensate from OUTSIDE — it pushed the whole iframe
 * down by the inset and painted the gap deep. That looks right for exactly
 * one pixel row. Everywhere else it is wrong, because the app never learns an
 * inset exists: it starts its 64px sky at what it thinks is the top of the
 * screen, so the entire sky-900 → paper ramp gets crammed into the strip
 * immediately below the status bar and is spent by the time it clears the
 * masthead. On a real device that ramp runs from the very top of the glass,
 * behind the clock. Two different pictures of the same screen.
 *
 * So the inset is passed IN, as a query parameter, and written over the
 * variable. The app then lays out beneath it exactly as it does on hardware —
 * one sky, one ramp, starting where the glass starts.
 *
 * ── IT IS A PX NUMBER IN THE APP'S OWN UNITS ──────────────────────────────
 * The preview scales the iframe, so the caller divides the device inset by
 * that scale before sending it. What arrives is already in the app's logical
 * pixels and needs no further correction here.
 *
 * Written to `documentElement` rather than held in React state: the value is
 * ambient, every surface reads it through CSS, and it must survive the
 * client-side navigations the dock performs (which drop the query string).
 */
export function SafeArea() {
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("inset");
    if (raw === null) return;
    const px = Number(raw);
    // Ignore anything that is not a sane, finite inset — a malformed param
    // should leave the app on `env()`, never push the chrome off-screen.
    if (!Number.isFinite(px) || px < 0 || px > 200) return;
    document.documentElement.style.setProperty("--safe-top", `${px}px`);
  }, []);

  return null;
}
