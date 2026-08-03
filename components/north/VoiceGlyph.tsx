"use client";

import {
  SPRING,
  TRANSITION,
  m,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "@/components/nds";
import { cn } from "@/lib/cn";
import { STROKE_OPACITY, toPath, type Figure } from "./TurnGlyph";

/**
 * The voice, drawn — one line that takes three forms.
 *
 * ── WHY NOT `TurnGlyph` DIRECTLY ──────────────────────────────────────────
 * Voice mode first borrowed onboarding's figures, cycling through "liquid",
 * "confidence", "horizon" while North talked. They morphed beautifully and
 * meant nothing: those drawings are about a *question being asked*, and
 * reusing them here was decoration wearing the costume of meaning. The
 * states of a conversation deserve their own three figures.
 *
 * ── SAME SKELETON, SAME RULE ──────────────────────────────────────────────
 * Six strokes, six anchors each, through the SAME Catmull-Rom converter
 * `TurnGlyph` uses (`toPath`). That is what makes every figure compile to
 * `M + 5C` and flow into every other on a critically damped spring — one
 * continuous line re-forming, never a swap. Adding a state means placing
 * anchors, never writing path data.
 *
 * ── THE THREE FORMS ───────────────────────────────────────────────────────
 *   listening — an open bowl, nested arcs widening upward. Receptive: the
 *               shape of something taking in rather than putting out. It
 *               breathes on your real microphone level.
 *   thinking  — the same lines drawn inward into a tightening coil. The
 *               figure contracts toward its own centre and turns slowly.
 *   speaking  — the coil released into travelling waves, flowing outward
 *               left to right. Speech leaving, without a speaker cone or a
 *               radiating arc anywhere near it.
 *
 * Everything stills under `prefers-reduced-motion`; the morph itself
 * collapses to an instant cut rather than animating.
 */

export type VoiceState = "listening" | "thinking" | "speaking";

/** An open bowl — nested arcs, widest at the top. Receptive. */
const LISTENING: Figure = [
  [[12, 20], [26, 24], [40, 26], [56, 26], [70, 24], [84, 20]],
  [[16, 24], [28, 28], [41, 30], [55, 30], [68, 28], [80, 24]],
  [[20, 28], [31, 32], [42, 34], [54, 34], [65, 32], [76, 28]],
  [[24, 32], [34, 36], [43, 38], [53, 38], [62, 36], [72, 32]],
  [[28, 36], [36, 40], [44, 42], [52, 42], [60, 40], [68, 36]],
  [[32, 40], [39, 44], [45, 45], [51, 45], [57, 44], [64, 40]],
];

/** The same lines drawn inward — a coil tightening on its own centre. */
const THINKING: Figure = [
  [[30, 22], [40, 18], [52, 18], [62, 24], [64, 34], [56, 40]],
  [[33, 25], [41, 22], [51, 22], [59, 27], [61, 34], [55, 39]],
  [[36, 28], [42, 26], [50, 26], [56, 30], [57, 35], [53, 38]],
  [[39, 31], [43, 29], [49, 29], [53, 32], [54, 35], [51, 37]],
  [[41, 33], [44, 32], [48, 32], [51, 34], [51, 36], [49, 37]],
  [[43, 34], [45, 34], [48, 34], [49, 35], [49, 36], [48, 36]],
];

/** Released into travelling waves — speech leaving, left to right. */
const SPEAKING: Figure = [
  [[10, 26], [26, 22], [42, 26], [58, 22], [74, 26], [88, 23]],
  [[10, 30], [26, 27], [42, 31], [58, 27], [74, 31], [88, 28]],
  [[12, 34], [27, 32], [42, 35], [57, 32], [72, 35], [85, 33]],
  [[14, 38], [28, 36], [42, 39], [56, 36], [70, 39], [82, 37]],
  [[18, 42], [30, 41], [42, 43], [55, 41], [68, 43], [78, 41]],
  [[22, 46], [33, 45], [43, 47], [54, 45], [65, 47], [74, 45]],
];

const FIGURE: Record<VoiceState, Figure> = {
  listening: LISTENING,
  thinking: THINKING,
  speaking: SPEAKING,
};

export interface VoiceGlyphProps {
  state: VoiceState;
  /** Live mic level in [0,1]. Only read while listening. */
  amplitude?: MotionValue<number>;
  className?: string;
}

export function VoiceGlyph({ state, amplitude, className }: VoiceGlyphProps) {
  const reduce = useReducedMotion();
  const figure = FIGURE[state];

  // Always a real MotionValue behind the transform — a conditional hook
  // would be the actual bug, not this fallback.
  const fallback = useMotionValue(0);
  const breath = useTransform(amplitude ?? fallback, [0, 1], [1, 1.09]);

  /**
   * The group's own life, one per state and never two at once.
   *
   * Listening is driven by YOUR voice, so it gets no invented motion — the
   * amplitude scale is the life. Thinking turns slowly, the way a thought
   * turns over. Speaking breathes on a cadence, because the mark is talking
   * rather than oscillating.
   */
  const groupAnimate =
    reduce || state === "listening"
      ? { rotate: 0, scale: 1 }
      : state === "thinking"
        ? { rotate: [0, 6, 0, -6, 0], scale: [1, 0.97, 1, 0.97, 1] }
        : { rotate: 0, scale: [1, 1.03, 1, 1.02, 1] };

  const groupTransition =
    reduce || state === "listening"
      ? TRANSITION.considered
      : {
          duration: state === "thinking" ? 4.2 : 3,
          repeat: Infinity,
          ease: "easeInOut" as const,
        };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 64"
      fill="none"
      className={cn("h-12 w-[72px] overflow-visible", className)}
    >
      <m.g
        animate={groupAnimate}
        transition={groupTransition}
        style={{
          transformBox: "fill-box",
          transformOrigin: "50% 50%",
          // Listening is the only state your own voice drives.
          scale: state === "listening" ? breath : undefined,
        }}
      >
        {figure.map((stroke, index) => (
          <m.path
            key={index}
            d={toPath(stroke)}
            stroke="currentColor"
            strokeWidth={1.1}
            strokeLinecap="round"
            strokeOpacity={STROKE_OPACITY[index]}
            initial={{ pathLength: 0 }}
            animate={{
              d: toPath(stroke),
              pathLength: 1,
              // Only speech travels. The waves drift sideways on staggered
              // phases so the figure reads as moving THROUGH the form rather
              // than wobbling in place.
              x: reduce || state !== "speaking" ? 0 : [0, 3.5, 0, -3.5, 0],
            }}
            transition={{
              // The cascade — strokes re-form in loose formation, which is
              // what makes it read as one line finding a new shape.
              d: reduce
                ? { duration: 0 }
                : { ...SPRING.fluid, delay: index * 0.05 },
              pathLength: {
                ...TRANSITION.considered,
                delay: 0.08 + index * 0.1,
              },
              x: {
                duration: 2.6 + index * 0.18,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />
        ))}
      </m.g>
    </svg>
  );
}
