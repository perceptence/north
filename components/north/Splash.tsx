"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  DURATION,
  EASE,
  m,
  useReducedMotion,
  Wordmark,
} from "@/components/nds";

/**
 * The launch beat — a radial sky, the mark at its centre, then the app.
 *
 * ── EVERY LAUNCH, NOT ONCE A SESSION ──────────────────────────────────────
 * It used to write a `sessionStorage` flag and skip itself afterwards, on the
 * theory that a launch is a session thing. In practice that meant the beat
 * was invisible for the rest of the day — including on the reload you do
 * immediately after changing something, which is the moment you most want to
 * see it. A splash is the app OPENING, and a page load IS the app opening,
 * so it plays on every one of them.
 *
 * It still does not play on soft navigation between destinations, and that
 * needs no flag: the product shell owns this component, the shell survives
 * client-side routing, so Today → Goals never remounts it. Mount is the
 * honest definition of launch, and mount is what drives it.
 *
 * ── WHAT IT COVERS ────────────────────────────────────────────────────────
 * Everything North knows lives in localStorage, which the server cannot
 * read, so every screen renders empty and fills after hydration. The splash
 * holds the brand over that swap — it covers real work, which is the only
 * condition under which this product draws a wait at all
 * (docs/UX-ARCHITECTURE.md §11). No spinner, no progress: a mark on the sky,
 * then the product.
 *
 * ── THE RADIAL ────────────────────────────────────────────────────────────
 * A radial ombre, not the linear masthead ramp: the mark sits at the centre
 * of its own light rather than partway down someone else's gradient. The
 * three sky tokens are the ones `.atmosphere` already uses, so this is the
 * product's own weather seen from directly beneath it.
 *
 * ── AND HOW IT LEAVES ─────────────────────────────────────────────────────
 * It opens from its own centre. The cover was sliding UPWARD at first, which
 * is a curtain's exit — coherent over a linear gradient, and nonsense over a
 * radial one: a light with a middle does not have a top edge to leave by. So
 * the glow scales up through the viewer and dissolves, and the app is behind
 * it. Quick, because this is the release of a held breath, not a passage.
 *
 * The exit animates the COVER, never the content — "motion never gates
 * visibility" holds, because nothing underneath ever waited on it. This is
 * the same exception `motion.ts` grants overlays: a splash renders OVER
 * content rather than being it, and a dropped frame leaves a stuck cover,
 * not a blank page. Tap skips. Reduced motion cuts straight to the app.
 */

/** Long enough to register as a beat, short enough to never feel like a gate. */
const HOLD_MS = 1100;

/**
 * The aperture opening. Far enough past 1 to read as motion toward you at
 * this speed; not so far that the mark smears on its way out.
 */
const ZOOM_TO = 1.35;

/**
 * Duration, not a spring. A spring only asymptotes toward its target, and
 * this element UNMOUNTS at the end — so the last frames of an easing curve
 * have to actually arrive, or the cover pops rather than opening. `micro` is
 * a cut at this scale; `standard` is the shortest step that still reads as a
 * zoom.
 */
const OPENING = { duration: DURATION.standard, ease: EASE.out } as const;

export function Splash() {
  const reduce = useReducedMotion();
  const [showing, setShowing] = useState(true);

  useEffect(() => {
    if (!showing) return;
    const timer = window.setTimeout(
      () => setShowing(false),
      reduce ? 0 : HOLD_MS,
    );
    return () => window.clearTimeout(timer);
  }, [showing, reduce]);

  return (
    <AnimatePresence>
      {showing && (
        <m.div
          key="splash"
          onClick={() => setShowing(false)}
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0 } }
              : { scale: ZOOM_TO, opacity: 0 }
          }
          transition={OPENING}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            // The sky, seen from directly beneath it. Same three tokens as
            // `.atmosphere`, arranged around the mark instead of above it.
            backgroundImage:
              "radial-gradient(circle at 50% 50% in oklab, var(--sky-300) 0%, var(--sky-600) 45%, var(--sky-900) 100%)",
          }}
        >
          <div className="text-text-on-deep">
            <Wordmark height={30} strokeWidth={1.5} />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
