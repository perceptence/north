import type { Confidence, Field } from "../confidence.ts";
import type { Cents, FigureFormat, Months } from "../money.ts";
import type { Obligation, SituationProfile } from "../profile/types.ts";
import type { ContributionLimits } from "./limits.ts";

/**
 * The Waterfall — North's intelligence.
 *
 * Financial priority is universal and ordered. Everyone occupies the same
 * ladder; only their rung differs. That is what lets North serve everyone
 * without ever asking them to classify themselves (docs/FOUNDATION.md §4).
 */

export type RungId =
  | "liquidity"
  | "match"
  | "high-interest-debt"
  | "tax-advantaged"
  | "goal"
  | "taxable"
  | "optimization";

/* ── The Read ─────────────────────────────────────────────────────────────
   Prose with typed figures interleaved. Because a Read IS a sentence
   containing figures, "never a number without a read" stops being a guideline
   and becomes a shape — there is no way to construct a bare number for
   display (docs/ARCHITECTURE.md §4).
   ─────────────────────────────────────────────────────────────────────── */

export type ReadSegment =
  | { kind: "text"; value: string }
  | {
      kind: "figure";
      /** Integer. Cents, basis points, or months depending on `format`. */
      value: number;
      format: FigureFormat;
      confidence: Confidence;
      /** Collapse large currency in prose: $1,500,000 → $1.5M. */
      abbreviate?: boolean;
      /**
       * Break this figure onto its own display-size line — the pull-quote
       * number. AT MOST ONE per read: two emphasized figures is a dashboard.
       */
      emphasis?: boolean;
      /** Spoken description for assistive tech. e.g. "in checking" */
      label?: string;
      /** Opens the derivation sheet. */
      interrogable?: boolean;
    };

export interface Read {
  segments: ReadSegment[];
  action: {
    /** The commitment. Names a gap and an action — never a security. */
    commit: string;
    defer: string;
  };
}

/* ── Derived facts ────────────────────────────────────────────────────────
   Computed once and shared, so rules neither recompute nor disagree.
   ─────────────────────────────────────────────────────────────────────── */

export interface DerivedFacts {
  /** From the income band midpoint — hence `assumed`. */
  monthlyIncome: Field<Cents>;
  /** Months of outgoings the current cash covers. */
  liquidityMonths: Field<Months>;
  /** 3, or 6 when there are dependents. */
  liquidityFloorMonths: Months;
  /** The costliest obligation at or above the high-interest threshold. */
  costliestObligation: Field<Obligation | null>;
  /** Annual retirement contribution implied by income × rate. */
  annualRetirement: Field<Cents>;
  /** Configured tax-advantaged room not being used. */
  unusedTaxAdvantaged: Field<Cents>;
  /** Income less outgoings less retirement contributions. May be negative. */
  monthlySurplus: Field<Cents>;
  /** Cash held beyond the liquidity floor. */
  excessCash: Field<Cents>;
}

export interface RungContext {
  profile: SituationProfile;
  facts: DerivedFacts;
  limits: ContributionLimits;
  /** Injected. The engine never reads a clock. */
  now: Date;
}

/**
 * A rung is DATA, not control flow.
 *
 * There is no `if (persona === …)` anywhere in this engine — evaluation is
 * "find the first unsatisfied rule". That is the whole mechanism by which one
 * code path serves every user.
 */
export interface Rung {
  id: RungId;
  /** 1-indexed position on the ladder. */
  index: number;
  label: string;
  satisfied(ctx: RungContext): boolean;
  read(ctx: RungContext): Read;
}

export interface RungState {
  id: RungId;
  index: number;
  label: string;
  satisfied: boolean;
}

export interface Evaluation {
  /**
   * The one thing that matters right now, or `null` when every rung is
   * satisfied — the reward state (docs/UX-ARCHITECTURE.md §7.2).
   */
  current: { rung: RungState; read: Read } | null;
  /** Every rung and whether it is met. Drives the RungIndicator. */
  ladder: RungState[];
  /** Exposed so the derivation sheet can show its working. */
  facts: DerivedFacts;
}

export interface EvaluateOptions {
  limits: ContributionLimits;
  /** Injected so results are reproducible and testable without freezing time. */
  now: Date;
  /**
   * Rungs to pass over even when unsatisfied.
   *
   * Deferral has to mean something. Without this, waving something off would
   * surface the identical decision on the next render — which reads as nagging,
   * and trains people to stop answering honestly (docs/UX-ARCHITECTURE.md §6,
   * F5). A skipped rung still reports as unsatisfied in the ladder; it is
   * simply not the thing being asked about right now.
   */
  skip?: RungId[];
}
