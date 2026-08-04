"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  DURATION,
  EASE,
  m,
  SPRING,
  useReducedMotion,
  Wordmark,
} from "@/components/nds";
import {
  COMPASS,
  COMPASS_CENTER,
  LETTERS,
  NEEDLE_NORTH,
  PLUS_ENSIGN,
  PLUS_RATIO,
  PLUS_VIEW,
  WORD_RATIO,
  WORD_VIEW,
} from "@/components/nds/Wordmark";
import { useMembership } from "@/state/membership-store";

/**
 * The launch beat — the compass finds north, and the name writes itself.
 *
 * ── THE CHOREOGRAPHY ──────────────────────────────────────────────────────
 * This is the first thing anyone sees, so it carries the identity's whole
 * argument in about two seconds:
 *
 *   1. The RING draws in — the instrument arrives first.
 *   2. The NEEDLE wakes pointing the wrong way and swings to north on a
 *      critically damped spring: it SETTLES, it never wobbles. The one
 *      filled shape in the identity earns its fill by doing its job.
 *   3. The LETTERS write themselves outward from the O — N to the left,
 *      R, T, H to the right — each stroke drawing the way every glyph in
 *      the product draws. The compass is the origin; the name grows from it.
 *   4. A held beat, then the whole sky opens through the viewer.
 *
 * Not one path here is new. The geometry is imported from the locked mark —
 * this file choreographs the drawing; it never redraws it.
 *
 * ── WHY IT PLAYS EVERY LAUNCH ─────────────────────────────────────────────
 * A page load IS the app opening. The shell survives client-side routing, so
 * moving between destinations never remounts this — mount is the honest
 * definition of launch, and the only flag needed is none.
 *
 * ── THE BACKDROP REACHES FULL DEPTH ───────────────────────────────────────
 * The radial lands on sky-900 by 82% of its run, so every EDGE of the screen
 * is uniformly the deepest sky — the top row of pixels included, which is
 * what the OS status bar (and the preview frame's drawing of one) sits over.
 * The first version ran the ramp to 100%, which left the top-centre a shade
 * lighter than the corners: a pale smile under the status bar, reading as a
 * seam between the app and the phone. The page's `themeColor` is pinned to
 * the same deep sky for the same reason.
 *
 * Reduced motion: the finished lockup, a beat, and a cut — the identity
 * without the performance.
 */

/** Draw (~1.2s), then a held beat with the finished mark. */
const HOLD_MS = 2100;

/** The needle wakes pointing south-west, and swings home. */
const NEEDLE_FROM_DEG = -150;

/**
 * The letters, outward from the compass: N leftward as R, T, H write
 * rightward. Delays in seconds; each stroke within a letter follows its
 * predecessor by a pen-lift.
 */
const LETTER_DELAY: readonly number[] = [
  0.5, 0.56, 0.62, // N
  0.62, 0.68, 0.74, // R
  0.74, 0.8, // T
  0.86, 0.92, 0.98, // H
];

/** One stroke of the mark, drawing itself. */
function Drawn({ d, delay, fill }: { d: string; delay: number; fill?: boolean }) {
  return (
    <m.path
      d={d}
      fill={fill ? "currentColor" : "none"}
      initial={{ pathLength: 0, fillOpacity: fill ? 0 : undefined }}
      animate={{ pathLength: 1, fillOpacity: fill ? 1 : undefined }}
      transition={{
        pathLength: { duration: 0.45, ease: EASE.out, delay },
        fillOpacity: { duration: 0.3, ease: EASE.out, delay: delay + 0.2 },
      }}
    />
  );
}

/**
 * The lockup, performing. Exactly the Wordmark's geometry, choreographed.
 *
 * A member's launch draws the Plus lockup — the rose settles in last, after
 * the name, the way a seal is pressed after a letter is written. Someone
 * paying for this should be met by the mark they wear, not by everyone
 * else's and a badge discovered later in the masthead.
 */
function DrawnWordmark({ height, plus }: { height: number; plus: boolean }) {
  return (
    <m.svg
      viewBox={plus ? PLUS_VIEW : WORD_VIEW}
      width={Math.round(height * (plus ? PLUS_RATIO : WORD_RATIO))}
      height={height}
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      // The whole mark eases up to size as it draws — arrival, not assembly.
      initial={{ scale: 0.94 }}
      animate={{ scale: 1 }}
      transition={SPRING.considered}
      className="overflow-visible"
    >
      {/* The instrument first: ring, then its bezel ticks. */}
      <m.circle
        cx={COMPASS_CENTER.x}
        cy={COMPASS_CENTER.y}
        r={14}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, ease: EASE.out }}
      />
      <Drawn d={COMPASS[0]} delay={0.4} />
      <Drawn d={COMPASS[1]} delay={0.4} />

      {/* The needle — both halves on one pivot, waking wrong and settling
          on north. Critically damped: it arrives, it does not wobble. */}
      <m.g
        initial={{ rotate: NEEDLE_FROM_DEG }}
        animate={{ rotate: 0 }}
        transition={{ ...SPRING.considered, delay: 0.25 }}
        style={{
          transformBox: "view-box",
          transformOrigin: `${COMPASS_CENTER.x}px ${COMPASS_CENTER.y}px`,
        }}
      >
        <Drawn d={COMPASS[2]} delay={0.2} />
        <Drawn d={NEEDLE_NORTH} delay={0.2} fill />
      </m.g>

      {/* The name, writing outward from the O. */}
      {LETTERS.map((d, index) => (
        <Drawn key={d} d={d} delay={LETTER_DELAY[index] ?? 0.9} />
      ))}

      {/* The seal, last — and it ARRIVES rather than appearing: in from the
          right, quick, the way a stamp is brought down onto a finished
          letter. It travels on `x` (a fade-up would have made it the one
          soft thing in a drawing that is otherwise all pen), and the needle
          settles the same way the big one did as it lands. */}
      {plus && (
        <m.g
          initial={{ x: 26, rotate: NEEDLE_FROM_DEG, opacity: 0 }}
          animate={{ x: 0, rotate: 0, opacity: 1 }}
          transition={{
            x: { duration: 0.26, ease: EASE.out, delay: 1.15 },
            rotate: { ...SPRING.considered, delay: 1.2 },
            opacity: { duration: 0.14, ease: EASE.out, delay: 1.15 },
          }}
          style={{
            transformBox: "view-box",
            transformOrigin: "197px 39.4px",
          }}
        >
          {PLUS_ENSIGN.strokes.map((d) => (
            <path key={d} d={d} />
          ))}
          <path d={PLUS_ENSIGN.south} />
          <path d={PLUS_ENSIGN.north} fill="currentColor" />
        </m.g>
      )}
    </m.svg>
  );
}

export function Splash() {
  const reduce = useReducedMotion();
  const membership = useMembership();
  const plus = membership.tier === "plus";
  const [showing, setShowing] = useState(true);

  useEffect(() => {
    if (!showing) return;
    const timer = window.setTimeout(
      () => setShowing(false),
      reduce ? 600 : HOLD_MS,
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
              : { scale: 1.35, opacity: 0 }
          }
          transition={{ duration: DURATION.standard, ease: EASE.out }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            // Deep at every edge by 82% — see the backdrop note above.
            backgroundImage:
              "radial-gradient(circle at 50% 50% in oklab, var(--sky-300) 0%, var(--sky-600) 42%, var(--sky-900) 82%)",
            backgroundColor: "var(--sky-900)",
          }}
        >
          <div className="text-text-on-deep">
            {reduce ? (
              <Wordmark height={30} strokeWidth={1.5} plus={plus} />
            ) : (
              <DrawnWordmark height={30} plus={plus} />
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
