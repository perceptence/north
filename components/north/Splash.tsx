"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  AnimatePresence,
  m,
  TRANSITION,
  useReducedMotion,
  Wordmark,
} from "@/components/nds";

/**
 * The launch beat — the sky, the mark, then the app.
 *
 * ── WHAT IT HONESTLY COVERS ───────────────────────────────────────────────
 * Everything North knows lives in localStorage, which the server cannot
 * read, so every screen renders empty and fills after hydration. On a phone
 * that is a visible pop-in at the exact moment of first impression. The
 * splash holds the brand over that swap and lifts once the app under it is
 * real — it covers actual work, which is the only condition under which
 * this product draws a wait at all (docs/UX-ARCHITECTURE.md §11). There is
 * NO spinner and NO progress anything: a mark on the sky, then the product.
 *
 * ── WHY IT IS RENDERED ON THE SERVER ──────────────────────────────────────
 * A splash that mounts after hydration would appear AFTER the thing it
 * exists to cover. So it server-renders open, and `useSyncExternalStore`'s client
 * snapshot closes it before first paint when this session has seen it. `sessionStorage`
 * rather than localStorage: a launch is a session thing — an installed app
 * cold-starting gets the beat, a tab kept open all day does not get it again
 * on every navigation.
 *
 * ── AND HOW IT LEAVES ─────────────────────────────────────────────────────
 * The whole sky lifts, a curtain rising off the page that is already there.
 * The exit animates the COVER, never the content — "motion never gates
 * visibility" stays true because nothing under it waits for it. Tap skips.
 * Reduced motion removes it without ceremony.
 *
 * Below `lg` only: on desktop the app arrives inside a browser chrome that
 * has its own loading affordances, and a full-screen brand moment there
 * reads as an ad. On a phone or tablet — held, launched, full-bleed — it
 * reads as an app opening.
 */

const SEEN_KEY = "north.splash";
/** Long enough to register as a beat, short enough to never feel like a gate. */
const HOLD_MS = 1100;

const noopSubscribe = () => () => {};

/**
 * Whether this session already had its beat — read the way "server and
 * client disagree" is meant to be read. The server snapshot says show (it
 * cannot know), the client snapshot answers from sessionStorage, and React
 * reconciles without a flash or a setState-in-effect. Storage that throws
 * (privacy modes) counts as unseen: every launch a first launch is the
 * harmless direction to fail.
 */
function useSeenThisSession(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return window.sessionStorage.getItem(SEEN_KEY) !== null;
      } catch {
        return false;
      }
    },
    () => false,
  );
}

export function Splash() {
  const reduce = useReducedMotion();
  const seen = useSeenThisSession();
  const [dismissed, setDismissed] = useState(false);
  const showing = !seen && !dismissed;

  // The flag is written at DISMISSAL, not at mount: the layout persists
  // across route changes, so this mounts once per real launch — and writing
  // early would flip the snapshot above mid-beat.
  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* the beat repeats next launch — harmless */
    }
  };

  useEffect(() => {
    if (!showing) return;
    const timer = window.setTimeout(dismiss, reduce ? 0 : HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [showing, reduce]);

  return (
    <AnimatePresence>
      {showing && (
        <m.div
          key="splash"
          onClick={dismiss}
          exit={reduce ? { y: "-100%", transition: { duration: 0 } } : { y: "-100%" }}
          transition={TRANSITION.considered}
          className="fixed inset-0 z-50 flex items-center justify-center lg:hidden"
          style={{
            // The full atmosphere, floor to ceiling — the same ramp every
            // masthead crops the top of, so the app appearing under this
            // reads as the splash's own sky settling into the chrome.
            backgroundImage:
              "linear-gradient(180deg in oklab, var(--sky-900) 0%, var(--sky-600) 55%, var(--sky-300) 85%, var(--paper-50) 100%)",
          }}
        >
          {/* Upper third, where the mark sits against the deep sky — dead
              centre would put it on the teal, where on-deep ink thins out. */}
          <div className="-translate-y-16 text-text-on-deep">
            <Wordmark height={26} strokeWidth={1.6} />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
