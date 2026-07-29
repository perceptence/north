import type { ReadSegment, RungState } from "../waterfall/types.ts";

/**
 * Insights — the coach reflecting, in prose.
 *
 * ── WHAT THIS DELIBERATELY IS NOT ─────────────────────────────────────────
 * Not a metrics wall, and not a notification centre. Every observation is a
 * SENTENCE with figures inside it, the same shape as a Read, because the
 * product's whole position is that interpretation outranks measurement
 * (docs/VISUAL-DIRECTION.md §2, principle 2).
 *
 * ── AND WHAT IT CANNOT HONESTLY CLAIM ─────────────────────────────────────
 * North has no transaction history — by design, not omission
 * (docs/STRATEGY.md §9). So there is no "you spent 12% less on restaurants".
 * Fabricating a trend from a single snapshot would be the false-precision
 * failure in a new costume, and a reviewer would find it in one click.
 *
 * What IS real: the decision ledger is genuine time-series data, the ladder is
 * genuine progress, and the profile knows exactly which of its own fields are
 * guesses. Those three carry the screen.
 */

export type InsightKind =
  /** Where you stand on the ladder right now. */
  | "position"
  /** What you have actually done, from the ledger. */
  | "record"
  /** The single highest-leverage change available. */
  | "next-move"
  /** What North cannot see. Stated, not hidden. */
  | "blind-spot";

export interface Insight {
  kind: InsightKind;
  label: string;
  segments: ReadSegment[];
}

/**
 * A rung needs THREE states here, not two.
 *
 * "Satisfied" and "not satisfied" cannot describe someone who acted on a
 * decision North hasn't caught up with. Holding a commitment doesn't update the
 * profile — nothing re-asks for the new contribution rate — so the rung stays
 * unsatisfied while being skipped. With only two states the screen says
 * "nothing needs changing" directly above a rung marked "still ahead", which
 * reads as a contradiction because it is one.
 *
 * `settled` is the honest middle: you dealt with it, and North's picture of you
 * hasn't caught up. It also points at what actually fixes this — the correction
 * loop (docs/UX-ARCHITECTURE.md §5.3).
 */
export interface LadderRung extends RungState {
  /** Acted on or waved off, whether or not the profile reflects it. */
  settled: boolean;
}

export interface LadderProgress {
  /** Rungs the situation genuinely satisfies. */
  cleared: number;
  /** Rungs decided but not yet reflected in the profile. */
  settled: number;
  total: number;
  rungs: LadderRung[];
}

export interface InsightsReport {
  progress: LadderProgress;
  /**
   * How far along the buffer is, 0–100. `null` when there are no outgoings to
   * measure against.
   *
   * Capped at 100: "128% of your emergency fund" is noise, not encouragement.
   */
  bufferPercent: number | null;
  /** ISO date of the first decision, or null if there are none yet. */
  since: string | null;
  insights: Insight[];
}
