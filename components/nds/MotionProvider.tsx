"use client";

import { useEffect, type ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import { TRANSITION, assertMotionTokensInSync } from "./motion";

/**
 * The single place Motion is configured. Mounted once, in the root layout.
 *
 * ── This does NOT make the app a client tree ──────────────────────────────
 * `children` is passed in from a server component and stays server-rendered.
 * A client component that renders `{children}` is a boundary, not a contagion.
 * The rule from docs/ARCHITECTURE.md §7 still holds: `m.*` components live at
 * the leaves, because those DO drag their subtree client-side.
 *
 * ── strict ────────────────────────────────────────────────────────────────
 * `strict` makes `motion.div` throw, forcing `m.div`. That is the point: the
 * full `motion` component ships the entire feature set and defeats the code
 * split below. The error is loud and immediate rather than a silent regression
 * in bundle size.
 *
 * ── reducedMotion="user" ──────────────────────────────────────────────────
 * Motion drops transform and layout animations to instant for users who ask
 * for reduced motion, while leaving opacity intact. globals.css carries the
 * matching `prefers-reduced-motion` block for everything Motion doesn't own.
 * Two layers, because they cover different surfaces — and because anything
 * added later that forgets to ask is still caught by the CSS.
 */

/** Deferred into its own chunk. See motion-features.ts. */
const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

export interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  // Warns in development if globals.css and motion.ts have drifted apart.
  useEffect(() => {
    assertMotionTokensInSync();
  }, []);

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={TRANSITION.standard}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
