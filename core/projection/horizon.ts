import { derived, weakest, type Confidence } from "../confidence.ts";
import type { BasisPoints, Cents, Months } from "../money.ts";
import type { SituationProfile } from "../profile/types.ts";
import { derive } from "../waterfall/derive.ts";
import type { EvaluateOptions } from "../waterfall/types.ts";
import type { Projection, ProjectionAssumption, ReturnRange } from "./types.ts";

/**
 * Where this path leads.
 *
 * ── WHAT IT MODELS ────────────────────────────────────────────────────────
 * The deployable cash above the buffer floor, plus ongoing retirement
 * contributions, compounding to the horizon.
 *
 * Two consequences, both disclosed in `assumptions` rather than buried:
 *
 *   1. It ASSUMES THE CASH GETS DEPLOYED. That is deliberate — the band sits
 *      directly beneath the decision that moves it, so it should show where
 *      taking the decision leads. It is the decision made consequential
 *      (docs/STRATEGY.md §8).
 *
 *   2. It EXCLUDES ANYTHING NORTH HASN'T BEEN TOLD. MVP onboarding collects no
 *      existing investment balance, so the projection understates for anyone
 *      with one. North projects what it can see and says so, rather than
 *      inventing a field the product does not collect.
 *
 * ── REAL, NOT NOMINAL ─────────────────────────────────────────────────────
 * Returns are real (inflation-adjusted), so the output is in today's dollars.
 * A nominal projection looks impressively larger and is misleading — an
 * inflated number a user can't spend is exactly the false-precision problem in
 * a different costume.
 */

/** Real annual returns. Assumptions, not forecasts. See docs/WATERFALL.md. */
export const RETURN_RANGE: ReturnRange = {
  lowBps: 300, // 3% real
  midBps: 500, // 5% real
  highBps: 700, // 7% real
};

/** Band width when North knows nothing it needs / everything it needs. */
export const SPREAD = {
  widest: 1.6,
  narrowest: 1.0,
} as const;

const RANK: Record<Confidence, number> = { stated: 2, inferred: 1, assumed: 0 };

/**
 * How much wider to draw the band, given how well North knows the inputs.
 *
 * Blends across inputs rather than taking the weakest. The two aggregations
 * answer different questions: `Projection.confidence` is "how good is the worst
 * input?", this is "how much of the picture is solid?". A profile where most
 * things are known should draw a tighter band even if one input is a guess.
 *
 * This is what makes the visual claim literally true — a less-known person
 * gets a visibly wider band (docs/VISUAL-DIRECTION.md §7.1).
 */
export function spreadMultiplier(inputs: Confidence[]): number {
  if (inputs.length === 0) return SPREAD.widest;
  const mean =
    inputs.reduce((sum, c) => sum + RANK[c], 0) / (inputs.length * 2);
  return SPREAD.widest - (SPREAD.widest - SPREAD.narrowest) * mean;
}

/**
 * Future value of a principal plus a level monthly contribution.
 *
 * Money is integer cents at rest and at every boundary, but compounding is
 * unavoidably fractional — so the arithmetic happens in floats here and rounds
 * exactly once, at the edge, in `project`.
 */
export function futureValue(
  principalCents: Cents,
  monthlyContributionCents: Cents,
  annualRateBps: BasisPoints,
  months: Months,
): number {
  if (months <= 0) return principalCents;

  const annual = annualRateBps / 10_000;
  const monthly = (1 + annual) ** (1 / 12) - 1;

  // A zero real return is a legitimate input, and the annuity formula divides
  // by the rate — so it gets its own branch rather than an epsilon fudge.
  if (monthly === 0) {
    return principalCents + monthlyContributionCents * months;
  }

  const growth = (1 + monthly) ** months;
  return (
    principalCents * growth +
    monthlyContributionCents * ((growth - 1) / monthly)
  );
}

/**
 * Snaps a projected figure to three significant figures.
 *
 * "Honest about uncertainty" is enforced HERE rather than left to the renderer.
 * A caller that formats without abbreviating still cannot produce
 * "$1,247,832" — the module will not hand them one.
 */
export function roundForDisplay(cents: number): Cents {
  const value = Math.max(0, Math.round(cents));
  if (value === 0) return 0;

  const magnitude = Math.floor(Math.log10(value));
  const granularity = Math.max(100_000, 10 ** Math.max(0, magnitude - 2));
  return Math.round(value / granularity) * granularity;
}

/**
 * Returns `null` when there is nothing to project.
 *
 * Someone at the liquidity floor has no deployable cash and no contributions,
 * so the honest projection is zero — and rendering "your future: $0 – $0" to a
 * 25-year-old is the guilt register this product exists to avoid
 * (docs/STRATEGY.md §3, P3). It is also a distraction: at rung 1 the decision
 * is about next month, not about forty years out.
 *
 * `null` rather than a zeroed Projection so the caller cannot render it by
 * accident — `Card`'s `horizon` prop is optional precisely for this.
 */
export function project(
  profile: SituationProfile,
  options: EvaluateOptions,
): Projection | null {
  const facts = derive(profile, options);

  const principal = facts.excessCash.value;
  const monthlyContribution = Math.round(facts.annualRetirement.value / 12);
  const months = profile.horizonMonths.value;

  if (principal <= 0 && monthlyContribution <= 0) return null;

  const at = (bps: BasisPoints) =>
    futureValue(principal, monthlyContribution, bps, months);

  const central = at(RETURN_RANGE.midBps);
  const spread = spreadMultiplier([
    facts.excessCash.confidence,
    facts.annualRetirement.confidence,
    profile.horizonMonths.confidence,
  ]);

  // Widen symmetrically about the central estimate. The market range sets the
  // shape; how well North knows the person sets the width.
  const low = central - (central - at(RETURN_RANGE.lowBps)) * spread;
  const high = central + (at(RETURN_RANGE.highBps) - central) * spread;

  const confidence = derived(
    weakest(
      facts.excessCash.confidence,
      facts.annualRetirement.confidence,
      profile.horizonMonths.confidence,
    ),
  );

  const assumptions: ProjectionAssumption[] = [
    {
      label: "Annual return, after inflation",
      value: RETURN_RANGE.midBps,
      format: "percent",
      confidence: "assumed",
    },
    {
      label: "Put to work each month",
      value: monthlyContribution,
      format: "currency",
      confidence: facts.annualRetirement.confidence,
    },
    {
      label: "Cash above your buffer, invested",
      value: principal,
      format: "currency",
      confidence: facts.excessCash.confidence,
    },
    {
      label: "Time horizon",
      value: months,
      format: "duration",
      confidence: profile.horizonMonths.confidence,
    },
    {
      label: "Excludes anything you haven’t told us about",
      confidence: "assumed",
    },
    {
      label: "Assumes your income holds and you keep this change",
      confidence: "assumed",
    },
  ];

  return {
    lowCents: roundForDisplay(low),
    centralCents: roundForDisplay(central),
    highCents: roundForDisplay(high),
    confidence,
    spreadMultiplier: spread,
    horizonMonths: months,
    assumptions,
  };
}
