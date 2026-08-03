"use client";

import type { TargetAndTransition, Transition } from "motion/react";
import {
  m,
  SPRING,
  TRANSITION,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "@/components/nds";
import type { TurnId } from "@/core/onboarding/script";
import { cn } from "@/lib/cn";

/**
 * The turn glyph — one drawing that becomes the next one.
 *
 * Each turn gets a NAME (its essence, for the masthead) and a FIGURE: six
 * hairline strokes in the product's only graphic dialect. The strokes never
 * leave the stage. When the conversation moves, the compass ring opens into
 * the wave, the wave straightens into the rising line — the SAME six lines,
 * re-arranging. Continuity is the message: every question is one picture of
 * the same life.
 *
 * ── HOW THE MORPH WORKS ───────────────────────────────────────────────────
 * Motion can interpolate an SVG `d` string only when both endpoints share a
 * command skeleton. So glyphs are not authored as paths — they are authored
 * as ANCHOR GRIDS: always 6 strokes, always 6 anchors per stroke, run through
 * one Catmull-Rom → cubic converter. Every figure therefore compiles to
 * `M + 5C`, and every figure can flow into every other on `SPRING.fluid` —
 * slow and critically damped, because an overshooting line draws shapes
 * nobody designed. Adding a glyph means placing anchors, never writing paths.
 *
 * ── THE LIFE IS SEMANTIC ──────────────────────────────────────────────────
 * Between morphs each figure moves THE WAY ITS SUBJECT MOVES — not one
 * generic bob. The compass pivots like a needle settling on north. The waves
 * swell sideways. The graphs redraw themselves, a line being generated. The
 * vessel's water bobs. The snagged line tugs. The horizon fan breathes open
 * from its origin. Motion is meaning here, which is what earns an ambient
 * loop its place in a product that forbids decoration for its own sake.
 * Everything stills under prefers-reduced-motion.
 *
 * The glyph is aria-hidden scenery: draw-in, morph, and life are exempt from
 * the visibility rule (a dropped frame leaves a half-drawn decoration, never
 * missing content). Mount it ONCE and feed it new `turnId`s — keying it would
 * remount and destroy the continuity it exists for.
 */

/** An anchor: [x, y] in the 96×64 field. */
export type Anchor = readonly [number, number];
/** Exactly six anchors per stroke — the uniform skeleton. */
export type Stroke = readonly [Anchor, Anchor, Anchor, Anchor, Anchor, Anchor];
/** Exactly six strokes per figure. */
export type Figure = readonly [Stroke, Stroke, Stroke, Stroke, Stroke, Stroke];

/**
 * How a figure lives between morphs. One kind per glyph, chosen to enact the
 * figure's subject:
 *   pivot — the whole figure tilts about an origin (compass, the mark)
 *   swell — strokes travel sideways on staggered phases (water, tension)
 *   grow  — strokes draw themselves repeatedly (charts, journeys)
 *   bob   — a hair's-height vertical drift (vessels, figures, loads)
 *   fan   — the figure breathes open from an origin (the horizon)
 */
type Life =
  | { kind: "bob" }
  | { kind: "swell"; amp?: number }
  | { kind: "grow" }
  | { kind: "pivot"; deg: number; origin: string }
  | { kind: "fan"; origin: string };

interface Glyph {
  /** The essence of the step, for the masthead. A label, never a sentence. */
  name: string;
  figure: Figure;
  life: Life;
}

/** Layered depth: the lead strokes speak, the others accompany. */
export const STROKE_OPACITY = [1, 0.8, 0.62, 0.48, 0.38, 0.3] as const;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Catmull-Rom through the anchors, emitted as cubics. Uniform input, uniform
 * output — the whole morph system rests on this being the only way a figure
 * becomes a path.
 */
export function toPath(stroke: Stroke): string {
  const p = stroke;
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    d += ` C ${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)}, ${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(p2[1] - (p3[1] - p1[1]) / 6)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export const TURN_GLYPH: Record<TurnId, Glyph> = {
  /* The compass: needle, head, both halves of the ring, crosshair, ground.
     It pivots gently — a needle settling on north. */
  openingConcern: {
    name: "Bearings",
    life: { kind: "pivot", deg: 2.5, origin: "50% 52%" },
    figure: [
      [[48, 58], [48, 48], [48, 38], [48, 28], [48, 19], [48, 10]],
      [[34, 26], [40, 18], [48, 10], [48, 10], [56, 18], [62, 26]],
      [[46, 4], [33, 8], [24, 20], [24, 38], [33, 52], [46, 56]],
      [[50, 4], [63, 8], [72, 20], [72, 38], [63, 52], [50, 56]],
      [[38, 32], [41, 32], [44, 32], [52, 32], [55, 32], [58, 32]],
      [[20, 62], [31, 62], [42, 62], [54, 62], [65, 62], [76, 62]],
    ],
  },
  /* The swell: three waves deep, the level they settle toward, spray, seabed.
     The water actually travels — sideways, each depth on its own phase. */
  confidence: {
    name: "Footing",
    life: { kind: "swell", amp: 3.5 },
    figure: [
      [[8, 32], [22, 24], [36, 40], [50, 26], [64, 38], [84, 30]],
      [[10, 44], [24, 40], [38, 50], [52, 42], [66, 48], [84, 42]],
      [[12, 54], [26, 52], [40, 57], [54, 52], [66, 56], [84, 52]],
      [[12, 16], [26, 17], [40, 16], [54, 17], [68, 16], [84, 16]],
      [[48, 20], [49, 18], [50, 16], [52, 15], [53, 14], [54, 13]],
      [[30, 62], [36, 62], [42, 62], [54, 62], [60, 62], [66, 62]],
    ],
  },
  /* The climb: a market line, the slower truth, ground, peak, two markers.
     It draws itself over and over — a chart being generated. */
  incomeBand: {
    name: "The inflow",
    life: { kind: "grow" },
    figure: [
      [[8, 50], [22, 42], [36, 46], [50, 28], [64, 32], [86, 12]],
      [[8, 56], [24, 52], [40, 48], [56, 42], [70, 36], [86, 28]],
      [[8, 61], [24, 61], [40, 61], [56, 61], [72, 61], [86, 61]],
      [[78, 18], [80, 16], [82, 14], [84, 12], [86, 11], [88, 10]],
      [[50, 36], [50, 34], [50, 31], [50, 29], [50, 27], [50, 25]],
      [[36, 52], [36, 50], [36, 49], [36, 48], [36, 47], [36, 46]],
    ],
  },
  /* The same picture, leaving — generated the same way, falling instead.
     The ground survives the morph untouched. */
  monthlyOut: {
    name: "The outflow",
    life: { kind: "grow" },
    figure: [
      [[8, 12], [22, 22], [36, 18], [50, 34], [64, 30], [86, 48]],
      [[8, 26], [24, 30], [40, 36], [56, 40], [70, 44], [86, 50]],
      [[8, 61], [24, 61], [40, 61], [56, 61], [72, 61], [86, 61]],
      [[78, 42], [80, 44], [82, 46], [84, 48], [86, 49], [88, 50]],
      [[50, 42], [50, 44], [50, 46], [50, 48], [50, 50], [50, 52]],
      [[36, 26], [36, 28], [36, 30], [36, 31], [36, 32], [36, 33]],
    ],
  },
  /* The vessel: two walls, waterline, a ripple under it, the drop, its base.
     Held water bobs, barely. */
  liquid: {
    name: "Reserves",
    life: { kind: "bob" },
    figure: [
      [[26, 14], [24, 26], [24, 38], [28, 48], [36, 54], [46, 56]],
      [[70, 14], [72, 26], [72, 38], [68, 48], [60, 54], [50, 56]],
      [[30, 34], [37, 35], [44, 34], [52, 35], [59, 34], [66, 34]],
      [[34, 42], [40, 43], [46, 42], [52, 43], [58, 42], [62, 42]],
      [[48, 4], [46, 7], [45, 10], [48, 13], [51, 10], [50, 7]],
      [[36, 61], [41, 61], [46, 61], [51, 61], [56, 61], [60, 61]],
    ],
  },
  /* The snag: a line caught mid-run, two tangles, tension, fray, lead-in.
     It tugs — a short sideways strain, never released. */
  expensiveDebt: {
    name: "Drag",
    life: { kind: "swell", amp: 1.8 },
    figure: [
      [[8, 34], [24, 34], [36, 24], [44, 42], [54, 24], [84, 32]],
      [[36, 48], [42, 44], [46, 50], [50, 44], [54, 49], [58, 46]],
      [[12, 14], [28, 15], [44, 14], [58, 15], [70, 14], [84, 14]],
      [[84, 32], [86, 31], [88, 32], [90, 33], [91, 32], [92, 32]],
      [[40, 56], [44, 54], [47, 57], [50, 54], [53, 56], [56, 55]],
      [[8, 40], [10, 39], [12, 38], [14, 37], [15, 36], [16, 36]],
    ],
  },
  /* The load: a line dipping, plumb, the level above, the bob, two anchors.
     The weight rides its line, gently. */
  debtBalance: {
    name: "The weight",
    life: { kind: "bob" },
    figure: [
      [[8, 22], [22, 26], [36, 40], [60, 40], [74, 26], [88, 22]],
      [[48, 40], [48, 44], [48, 47], [48, 50], [48, 53], [48, 56]],
      [[8, 14], [24, 14], [40, 14], [56, 14], [72, 14], [88, 14]],
      [[44, 56], [46, 60], [50, 61], [53, 58], [51, 54], [47, 54]],
      [[8, 18], [8, 20], [8, 22], [8, 24], [8, 25], [8, 26]],
      [[88, 18], [88, 20], [88, 22], [88, 24], [88, 25], [88, 26]],
    ],
  },
  /* Two figures leaning into each other, a small third, a shared ground. */
  dependents: {
    name: "Leaning in",
    life: { kind: "bob" },
    figure: [
      [[34, 58], [36, 46], [39, 34], [43, 26], [47, 21], [52, 17]],
      [[68, 58], [66, 46], [63, 34], [59, 26], [55, 21], [51, 19]],
      [[24, 58], [34, 58], [45, 58], [56, 58], [67, 58], [78, 58]],
      [[44, 58], [44, 52], [45, 46], [46, 42], [47, 39], [48, 36]],
      [[49, 12], [51, 10], [54, 10], [56, 12], [56, 14], [54, 16]],
      [[48, 30], [50, 29], [52, 28], [54, 28], [56, 29], [58, 30]],
    ],
  },
  /* The long arc out: far horizon above it, near ground, two mile-markers.
     A journey drawing itself — the long game, played repeatedly. */
  retirement: {
    name: "The long game",
    life: { kind: "grow" },
    figure: [
      [[8, 54], [24, 52], [40, 47], [56, 39], [72, 28], [88, 14]],
      [[64, 8], [69, 8], [74, 8], [79, 8], [84, 8], [89, 8]],
      [[8, 58], [13, 58], [18, 58], [23, 58], [28, 58], [33, 58]],
      [[54, 44], [55, 42], [56, 40], [57, 38], [58, 36], [59, 34]],
      [[30, 52], [31, 50], [32, 49], [33, 48], [33, 47], [34, 46]],
      [[88, 14], [88, 12], [88, 10], [90, 9], [92, 10], [92, 12]],
    ],
  },
  /* One rise, echoed exactly — free money is the same line twice, bridged.
     Both lines generate together: the match mirrors you. */
  employerMatch: {
    name: "Matched",
    life: { kind: "grow" },
    figure: [
      [[14, 42], [27, 38], [40, 31], [53, 25], [66, 19], [80, 13]],
      [[14, 58], [27, 54], [40, 47], [53, 41], [66, 35], [80, 29]],
      [[44, 36], [45, 34], [46, 33], [47, 31], [48, 30], [49, 28]],
      [[62, 29], [63, 27], [64, 26], [65, 24], [66, 23], [67, 21]],
      [[26, 44], [27, 42], [28, 41], [29, 39], [30, 38], [31, 36]],
      [[14, 62], [20, 62], [26, 62], [32, 62], [38, 62], [44, 62]],
    ],
  },
  /* The fan: five futures from one origin — honestly wide, and breathing
     open from the point where they all begin. */
  horizon: {
    name: "Horizon",
    life: { kind: "fan", origin: "0% 60%" },
    figure: [
      [[8, 38], [24, 34], [40, 28], [56, 22], [72, 16], [88, 10]],
      [[8, 38], [24, 36], [40, 33], [56, 29], [72, 25], [88, 21]],
      [[8, 38], [24, 38], [40, 38], [56, 38], [72, 38], [88, 38]],
      [[8, 38], [24, 41], [40, 45], [56, 49], [72, 53], [88, 56]],
      [[8, 38], [24, 42], [40, 48], [56, 54], [72, 58], [88, 61]],
      [[8, 30], [8, 33], [8, 36], [8, 40], [8, 43], [8, 46]],
    ],
  },
  /* The goal conversation, same dialect. */
  goalLabel: {
    name: "Destination",
    life: { kind: "grow" },
    figure: [
      [[8, 54], [24, 50], [40, 44], [54, 36], [66, 28], [76, 20]],
      [[70, 14], [73, 17], [76, 20], [79, 23], [81, 25], [83, 27]],
      [[83, 14], [80, 17], [77, 20], [74, 23], [72, 25], [70, 27]],
      [[8, 58], [13, 58], [18, 58], [23, 58], [28, 58], [33, 58]],
      [[24, 48], [25, 46], [26, 45], [27, 43], [28, 42], [29, 40]],
      [[44, 40], [45, 38], [46, 37], [47, 35], [48, 34], [49, 32]],
    ],
  },
  goalTarget: {
    name: "The mark",
    life: { kind: "pivot", deg: 2, origin: "50% 50%" },
    figure: [
      [[46, 12], [34, 16], [28, 26], [28, 38], [34, 48], [46, 52]],
      [[50, 12], [62, 16], [68, 26], [68, 38], [62, 48], [50, 52]],
      [[48, 24], [48, 27], [48, 30], [48, 33], [48, 36], [48, 39]],
      [[40, 32], [43, 32], [45, 32], [51, 32], [53, 32], [56, 32]],
      [[36, 60], [41, 60], [46, 60], [51, 60], [56, 60], [60, 60]],
      [[48, 4], [48, 5], [48, 6], [48, 7], [48, 8], [48, 9]],
    ],
  },
  goalWhen: {
    name: "The date",
    life: { kind: "bob" },
    figure: [
      [[10, 44], [25, 44], [40, 44], [55, 44], [70, 44], [86, 44]],
      [[62, 44], [62, 38], [62, 32], [62, 26], [62, 22], [62, 16]],
      [[62, 16], [67, 17], [72, 19], [76, 21], [79, 22], [82, 24]],
      [[10, 48], [10, 46], [10, 44], [10, 42], [10, 41], [10, 40]],
      [[36, 48], [36, 47], [36, 46], [36, 45], [36, 44], [36, 43]],
      [[86, 48], [86, 47], [86, 46], [86, 45], [86, 44], [86, 43]],
    ],
  },
  goalSaved: {
    name: "Underway",
    life: { kind: "grow" },
    figure: [
      [[8, 40], [16, 40], [24, 40], [32, 40], [40, 40], [50, 40]],
      [[58, 40], [64, 40], [70, 40], [76, 40], [82, 40], [88, 40]],
      [[46, 34], [48, 32], [50, 30], [52, 32], [54, 34], [55, 35]],
      [[8, 46], [8, 44], [8, 42], [8, 40], [8, 38], [8, 36]],
      [[50, 46], [50, 45], [50, 44], [50, 43], [50, 42], [50, 41]],
      [[88, 46], [88, 44], [88, 42], [88, 40], [88, 38], [88, 36]],
    ],
  },
};

/** The per-stroke animation for a figure's life. Reduced motion stills all. */
function strokeLife(
  life: Life,
  index: number,
): { animate: TargetAndTransition; transition: Record<string, Transition> } {
  switch (life.kind) {
    case "swell": {
      const amp = life.amp ?? 4;
      return {
        animate: { x: [0, amp, 0, -amp, 0], y: 0, pathLength: 1 },
        transition: {
          x: {
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.55,
          },
        },
      };
    }
    case "grow":
      return {
        // Draw, hold, draw again — a line being generated.
        animate: { x: 0, y: 0, pathLength: [0, 1, 1] },
        transition: {
          pathLength: {
            duration: 5.5,
            times: [0, 0.45, 1],
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.25,
          },
        },
      };
    case "bob":
      return {
        animate: { x: 0, y: [0, -1.6, 0, 1.2, 0], pathLength: 1 },
        transition: {
          y: {
            duration: 6.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.9,
          },
        },
      };
    // pivot and fan live on the group, so strokes just hold steady.
    default:
      return { animate: { x: 0, y: 0, pathLength: 1 }, transition: {} };
  }
}

/** The whole-figure animation, for lives that move the figure as one body. */
function groupLife(life: Life): {
  animate: TargetAndTransition;
  transition: Record<string, Transition>;
  origin?: string;
} {
  switch (life.kind) {
    case "pivot":
      return {
        animate: { rotate: [0, life.deg, 0, -life.deg, 0] },
        transition: {
          rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" },
        },
        origin: life.origin,
      };
    case "fan":
      return {
        animate: { scaleY: [1, 1.05, 1, 0.965, 1] },
        transition: {
          scaleY: { duration: 7, repeat: Infinity, ease: "easeInOut" },
        },
        origin: life.origin,
      };
    default:
      return { animate: { rotate: 0, scaleY: 1 }, transition: {} };
  }
}

export interface TurnGlyphProps {
  turnId: TurnId;
  className?: string;
  /**
   * The mark is listening. Ambient life (the per-turn swell/grow/bob/pivot/
   * fan loop) holds still — the same still pose `prefers-reduced-motion`
   * already produces, reused rather than re-invented — and the whole figure
   * breathes on `amplitude` instead. Two competing motions read as noise;
   * only one may drive the mark at a time.
   */
  listening?: boolean;
  /**
   * Live mic level in [0, 1], as a MotionValue — see `lib/use-mic-amplitude`.
   * Read via `useTransform`, so a silent mic (permission refused, API
   * unavailable) just holds the figure at its resting scale rather than
   * looking broken. Ignored unless `listening` is true.
   */
  amplitude?: MotionValue<number>;
}

/**
 * Mount once, change `turnId`, watch the lines walk. Never key this on the
 * turn — a remount swaps figures instead of morphing them.
 */
export function TurnGlyph({
  turnId,
  className,
  listening = false,
  amplitude,
}: TurnGlyphProps) {
  const reduce = useReducedMotion();
  const { figure, life } = TURN_GLYPH[turnId];
  const group = groupLife(life);

  // Hooks run every render regardless of whether `amplitude` was passed, so
  // there is always a real MotionValue behind the transform — a conditional
  // hook call here would be the actual bug, not this fallback.
  const fallbackAmplitude = useMotionValue(0);
  // A hair of scale, not a lurch — SPRING/TRANSITION govern discrete moves,
  // this is a continuous read of a value that is ALREADY smoothed upstream
  // (the one-pole filter in useMicAmplitude), so no extra spring is layered
  // on top. If it ever reads as twitchy in practice, that filter's the knob.
  const listenScale = useTransform(amplitude ?? fallbackAmplitude, [0, 1], [1, 1.06]);

  // Reduced motion and active listening both mean the same thing to the
  // ambient loop: stop. They mean it for different reasons, so they stay two
  // named booleans rather than collapsing the reason away.
  const holdStill = reduce || listening;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 64"
      fill="none"
      className={cn("h-12 w-[72px] overflow-visible", className)}
    >
      <m.g
        animate={holdStill ? { rotate: 0, scaleY: 1 } : group.animate}
        transition={
          holdStill
            ? { rotate: TRANSITION.considered, scaleY: TRANSITION.considered }
            : group.transition
        }
        style={{
          transformBox: "fill-box",
          transformOrigin: group.origin ?? "50% 50%",
          // A plain 1 when not listening — inert, and never fights the
          // group's own rotate/scaleY animation above.
          scale: listening ? listenScale : 1,
        }}
      >
        {figure.map((stroke, index) => {
          const spark = strokeLife(life, index);
          return (
            <m.path
              key={index}
              d={toPath(stroke)}
              stroke="currentColor"
              strokeWidth={1.1}
              strokeLinecap="round"
              strokeOpacity={STROKE_OPACITY[index]}
              initial={{ pathLength: 0 }}
              animate={
                holdStill
                  ? { d: toPath(stroke), x: 0, y: 0, pathLength: 1 }
                  : { d: toPath(stroke), ...spark.animate }
              }
              transition={{
                // The cascade: strokes re-arrange in loose formation.
                d: reduce
                  ? { duration: 0 }
                  : { ...SPRING.fluid, delay: index * 0.05 },
                // The mount draw-in, unless the life keeps redrawing anyway.
                pathLength:
                  !holdStill && life.kind === "grow"
                    ? spark.transition.pathLength
                    : { ...TRANSITION.considered, delay: 0.1 + index * 0.12 },
                x: spark.transition.x ?? TRANSITION.considered,
                y: spark.transition.y ?? TRANSITION.considered,
              }}
            />
          );
        })}
      </m.g>
    </svg>
  );
}
