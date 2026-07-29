/**
 * Motion tokens — THE SOURCE OF TRUTH for North's timing vocabulary.
 *
 * `app/globals.css` mirrors these values as custom properties so CSS-driven
 * transitions (hover, focus, press, color) share the same vocabulary as
 * JS-driven animation. The two are checked against each other at runtime in
 * development — see `assertMotionTokensInSync`.
 *
 * Spec: docs/VISUAL-DIRECTION.md §8, docs/DESIGN-SYSTEM.md §7
 */

import type { Transition } from "motion/react";

/**
 * Durations in SECONDS — Motion's unit. CSS mirrors these in milliseconds.
 *
 * Speed is a design value. Everything is fast except the reveal, which is the
 * one place slowness is correct.
 */
export const DURATION = {
  micro: 0.12,
  standard: 0.22,
  considered: 0.32,
  ceremonial: 0.7,
} as const;

/** Cubic-bezier arrays matching `--ease-*` in globals.css. */
export const EASE = {
  out: [0.2, 0, 0, 1],
  spring: [0.32, 0.72, 0, 1],
} as const;

/**
 * Real springs — interruptible and retargetable, which is the reason Motion
 * earns its bundle over CSS.
 *
 * Both are critically damped or better, so they CANNOT overshoot. Overshoot
 * reads as playful, and playful is the wrong register for someone's money.
 *
 * Damping ratio ζ = damping / (2·√(stiffness · mass)), mass = 1.
 *   standard:   40 / (2·√400) = 40 / 40.0 = 1.000  → critically damped
 *   considered: 34 / (2·√260) = 34 / 32.2 = 1.054  → slightly overdamped
 *
 * Changing stiffness without recomputing damping will reintroduce overshoot.
 */
export const SPRING = {
  standard: { type: "spring", stiffness: 400, damping: 40 },
  considered: { type: "spring", stiffness: 260, damping: 34 },
  /**
   * Slow, liquid, for continuous shape interpolation (the turn glyph's morph).
   * ζ = 22 / (2·√120) = 1.004 — still critically damped; a morphing line that
   * overshoots draws shapes that were never designed.
   */
  fluid: { type: "spring", stiffness: 120, damping: 22 },
} as const satisfies Record<string, Transition>;

/**
 * The four motion classes, ready to hand to a `transition` prop.
 *
 * Positional movement uses springs; opacity and color use duration curves,
 * where a spring buys nothing.
 */
export const TRANSITION = {
  /** Press, hover, focus. Mostly handled in CSS — this is for JS parity. */
  micro: { duration: DURATION.micro, ease: EASE.out },
  /** Sheets, routes, card reveals. */
  standard: SPRING.standard,
  /** Recompute — must be legible as "the system reasoned", not "it refreshed". */
  considered: SPRING.considered,
  /** The reveal, and only the reveal. */
  ceremonial: { duration: DURATION.ceremonial, ease: EASE.out },
} as const satisfies Record<string, Transition>;

/**
 * ── THE RULE THAT OUTRANKS ALL OF THESE ───────────────────────────────────
 *
 * MOTION MAY NEVER GATE VISIBILITY. No entrance animates `opacity` from 0 on
 * content that must be readable.
 *
 * Motion is driven by requestAnimationFrame, and a browser stops delivering
 * frames to a tab that isn't visible — a background tab, an occluded window, a
 * link-preview renderer, a screenshot service. An element left mid-animation
 * simply stays there. `opacity: 0` mid-animation means a blank page.
 *
 * This was found the hard way: every product screen rendered completely empty
 * in an unfocused window, with the DOM fully populated underneath. Entrances
 * now move on `y` only, so the failure mode of a frame never arriving is
 * "content sits 8px low", not "content is invisible".
 *
 * Overlays are the one exception — a Sheet is user-triggered, so the window is
 * focused by definition, and it renders over content rather than being it.
 */

/**
 * Default viewport config for scroll-triggered reveals.
 *
 * `once: true` is not a preference — re-animating an element every time it
 * re-enters the viewport is the single most common way scroll animation becomes
 * irritating, and it fights "calm over comprehensive".
 */
export const VIEWPORT = {
  once: true,
  amount: 0.3,
  margin: "0px 0px -10% 0px",
} as const;

/* ── Drift protection ─────────────────────────────────────────────────────
   The CSS custom properties and the constants above are two copies of the
   same vocabulary. Two copies drift. This catches it in development, at the
   cost of nothing in production.
   ────────────────────────────────────────────────────────────────────── */

const CSS_MIRROR: Array<[cssVar: string, seconds: number]> = [
  ["--motion-micro", DURATION.micro],
  ["--motion-standard", DURATION.standard],
  ["--motion-considered", DURATION.considered],
  ["--motion-ceremonial", DURATION.ceremonial],
];

/** Parses "120ms" / "0.22s" to seconds. Returns null if unset or unparseable. */
function parseCssDuration(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;
  const match = value.match(/^([\d.]+)(ms|s)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2] === "ms" ? amount / 1000 : amount;
}

/**
 * Development-only check that globals.css still agrees with this file.
 *
 * Silent divergence between the CSS and JS timing vocabularies is exactly the
 * decay a design system exists to prevent — a token gets tuned in one place and
 * half the product keeps the old value.
 */
export function assertMotionTokensInSync(): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof document === "undefined") return;

  const root = getComputedStyle(document.documentElement);

  for (const [cssVar, expected] of CSS_MIRROR) {
    const actual = parseCssDuration(root.getPropertyValue(cssVar));

    if (actual === null) {
      console.warn(
        `[NDS motion] ${cssVar} is missing or unparseable in globals.css. ` +
          `components/nds/motion.ts expects ${expected}s.`,
      );
      continue;
    }

    if (Math.abs(actual - expected) > 0.0005) {
      console.warn(
        `[NDS motion] Timing drift: ${cssVar} is ${actual}s in globals.css but ` +
          `components/nds/motion.ts says ${expected}s. These must match — ` +
          `motion.ts is the source of truth.`,
      );
    }
  }
}
