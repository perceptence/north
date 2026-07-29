import type { Cents, FigureFormat } from "../money.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { Projection } from "../projection/types.ts";
import type { ContributionLimits } from "../waterfall/limits.ts";
import type { DerivedFacts, ReadSegment, RungId } from "../waterfall/types.ts";

/**
 * The Navigator — answering "what if?"
 *
 * ── WHY THIS IS NOT A CHAT BOX ────────────────────────────────────────────
 * A scenario is a TRANSFORMATION OF THE SITUATION, not a message. Ask "can I
 * buy a home in three years?" and the honest answer is: here is your profile
 * with that decision applied, run through the same engine, next to the one
 * without it.
 *
 * That framing is what makes the answer trustworthy — it is computed from the
 * same rules that produce Today, not generated. It is also why the questions
 * are curated rather than free text: a fixed set guarantees every answer is
 * real, and no reviewer can break it by typing something the product cannot
 * actually reason about (docs/STRATEGY.md §9).
 */

export type ScenarioId =
  | "home"
  | "career-break"
  | "debt-first"
  | "contribute-more"
  | "pay-cut";

/** Parameters carry numbers, except categorical ones like an income band. */
export type ParamValue = number | string;
export type ParamSet = Record<string, ParamValue>;

/**
 * A single adjustable input.
 *
 * Two kinds, and the distinction is meaningful rather than cosmetic:
 *
 *   choice — genuinely discrete. An income band is one of four things; there is
 *            no value between "$100k–$200k" and "$200k–$400k".
 *   range  — continuous, where the point is to explore. A deposit is any
 *            amount, and dragging to watch the projection move is what makes a
 *            simulator a simulator rather than a calculator.
 */
export type ScenarioParam =
  | {
      kind: "choice";
      id: string;
      label: string;
      options: { label: string; value: number | string }[];
    }
  | {
      kind: "range";
      id: string;
      label: string;
      min: number;
      max: number;
      step: number;
      /** How the value should read. Drives the slider's announced text. */
      format: FigureFormat;
    };

export type Verdict = "yes" | "yes-with-changes" | "not-yet";

/** One factor the answer considered. Kept short — three is the cap. */
export interface AnalysisPoint {
  label: string;
  segments: ReadSegment[];
}

export interface Recommendation {
  verdict: Verdict;
  /** One sentence. Names the call. */
  headline: string;
  /** What it costs. Every real recommendation has one. */
  tradeoff: string;
}

export interface ScenarioContext {
  profile: SituationProfile;
  facts: DerivedFacts;
  params: ParamSet;
  limits: ContributionLimits;
  now: Date;
}

export interface Scenario {
  id: ScenarioId;
  question: string;
  /** Hidden when the question cannot apply — e.g. debt with no debt. */
  applies(profile: SituationProfile): boolean;
  params: ScenarioParam[];
  defaults: ParamSet;
  /** The situation with the decision taken. */
  transform(context: ScenarioContext): SituationProfile;
  /**
   * The situation WITHOUT the decision, at the same point in time.
   *
   * Defaults to the profile as it stands. Scenarios that move through time must
   * override it, or the comparison lies: crediting the "after" side with years
   * of saving while the "before" side stays anchored at today makes buying a
   * house look like it makes you richer. Both sides have to stand at the same
   * moment for the two bands to mean anything.
   */
  baseline?(context: ScenarioContext): SituationProfile;
  understanding(context: ScenarioContext): ReadSegment[];
  analysis(context: ScenarioContext): AnalysisPoint[];
  recommendation(context: ScenarioContext): Recommendation;
}

export interface Side {
  rungId: RungId | null;
  rungIndex: number | null;
  rungLabel: string | null;
  projection: Projection | null;
}

export interface Impact {
  before: Side;
  after: Side;
  /**
   * Shared ceiling for both horizon bands.
   *
   * Without a common domain the two bands are drawn to different scales and the
   * comparison is a lie — which is precisely the caveat `HorizonBand` documents
   * for showing more than one at a time.
   */
  domainMaxCents: Cents;
}

export interface ScenarioAnswer {
  scenarioId: ScenarioId;
  question: string;
  understanding: ReadSegment[];
  analysis: AnalysisPoint[];
  recommendation: Recommendation;
  impact: Impact;
}
