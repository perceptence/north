import { derived, field, type Confidence } from "../confidence.ts";
import type { Cents } from "../money.ts";
import type { IncomeBand, Obligation, SituationProfile } from "../profile/types.ts";
import { totalTaxAdvantagedCents } from "./limits.ts";
import type { DerivedFacts, EvaluateOptions } from "./types.ts";

/**
 * Tunable thresholds, gathered in one place.
 *
 * Every one of these is a JUDGMENT, not a law. They are visible and named here
 * rather than buried inside a comparison so they can be argued with, tested,
 * and changed without archaeology. See docs/WATERFALL.md for the reasoning
 * behind each.
 */
export const THRESHOLDS = {
  /** Months of outgoings that constitute a minimum cash buffer. */
  liquidityFloorMonths: 3,
  /** Raised when anyone depends on this income. */
  liquidityFloorMonthsWithDependents: 6,
  /**
   * Debt at or above this rate is treated as beating any expected investment
   * return. 7% is the conventional heuristic — it sits above long-run real
   * equity expectations. It is an assumption, not arithmetic.
   */
  highInterestBps: 700,
  /** Cash beyond this many months, with everything else handled, is idle. */
  idleCashCeilingMonths: 12,
  /** Monthly surplus below this isn't worth surfacing as a decision. */
  meaningfulSurplusCents: 25_000,
} as const;

/**
 * Annual income assumed for each band, in cents.
 *
 * Using a midpoint is an ASSUMPTION, and it is the reason every figure
 * downstream of income carries `assumed` confidence. That degradation is not a
 * limitation to apologise for — it is the trust model working. A user reading
 * "our assumption" next to a surplus figure is being told the truth.
 */
export const BAND_ANNUAL_CENTS: Record<IncomeBand, Cents> = {
  "under-100k": 7_500_000, // $75,000
  "100k-200k": 15_000_000, // $150,000
  "200k-400k": 30_000_000, // $300,000
  "over-400k": 50_000_000, // $500,000
};

/** The costliest obligation at or above the high-interest threshold. */
function costliest(obligations: Obligation[]): Obligation | null {
  return obligations
    .filter(
      (o) => o.balanceCents > 0 && o.rateBps >= THRESHOLDS.highInterestBps,
    )
    .reduce<Obligation | null>(
      (worst, o) => (worst === null || o.rateBps > worst.rateBps ? o : worst),
      null,
    );
}

/**
 * Computes everything the rules share, once.
 *
 * All arithmetic stays in integer cents. Divisions round explicitly rather than
 * leaving a float to drift — money is never a float
 * (docs/CLAUDE.md, non-negotiables).
 */
export function derive(
  profile: SituationProfile,
  { limits, now }: EvaluateOptions,
): DerivedFacts {
  const asOf = now.toISOString();

  // Band → midpoint is an assumption, so this can never be better than
  // `assumed` however confident the band itself was.
  const monthlyIncomeCents = Math.round(
    BAND_ANNUAL_CENTS[profile.incomeBand.value] / 12,
  );
  const monthlyIncome = field<Cents>(monthlyIncomeCents, "assumed", asOf);

  const outCents = profile.monthlyOutCents.value;

  // Floor rather than round: a conservative read of how long the cash lasts.
  // 2.9 months must not present itself as 3.
  const liquidityMonths = field<number>(
    outCents > 0 ? Math.floor(profile.liquidCents.value / outCents) : 0,
    derived(profile.liquidCents.confidence, profile.monthlyOutCents.confidence),
    asOf,
  );

  const liquidityFloorMonths =
    profile.dependents.value > 0
      ? THRESHOLDS.liquidityFloorMonthsWithDependents
      : THRESHOLDS.liquidityFloorMonths;

  const costliestObligation = field<Obligation | null>(
    costliest(profile.obligations.value),
    derived(profile.obligations.confidence),
    asOf,
  );

  const annualRetirementCents = Math.round(
    (monthlyIncomeCents * 12 * profile.retirementBps.value) / 10_000,
  );
  const annualRetirementConfidence: Confidence = derived(
    monthlyIncome.confidence,
    profile.retirementBps.confidence,
  );
  const annualRetirement = field<Cents>(
    annualRetirementCents,
    annualRetirementConfidence,
    asOf,
  );

  const unusedTaxAdvantaged = field<Cents>(
    Math.max(0, totalTaxAdvantagedCents(limits) - annualRetirementCents),
    annualRetirementConfidence,
    asOf,
  );

  const monthlySurplus = field<Cents>(
    monthlyIncomeCents - outCents - Math.round(annualRetirementCents / 12),
    derived(
      monthlyIncome.confidence,
      profile.monthlyOutCents.confidence,
      annualRetirementConfidence,
    ),
    asOf,
  );

  const excessCash = field<Cents>(
    Math.max(0, profile.liquidCents.value - liquidityFloorMonths * outCents),
    derived(profile.liquidCents.confidence, profile.monthlyOutCents.confidence),
    asOf,
  );

  return {
    monthlyIncome,
    liquidityMonths,
    liquidityFloorMonths,
    costliestObligation,
    annualRetirement,
    unusedTaxAdvantaged,
    monthlySurplus,
    excessCash,
  };
}
