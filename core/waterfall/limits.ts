import type { Cents } from "../money.ts";

/**
 * Annual contribution limits.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ THESE ARE ILLUSTRATIVE FIXTURE VALUES FOR A PORTFOLIO DEMO.           │
 * │ They are NOT tax guidance and have NOT been verified against IRS      │
 * │ publications. Verify current figures before this touches a real user. │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Limits are INJECTED into the engine rather than imported by it. Two reasons,
 * and both matter:
 *
 *   1. They change every year. A figure baked into a comparison is a bug with
 *      a scheduled detonation date.
 *   2. It keeps the engine honest about what it is. North computes "you have
 *      unused space" from a configured number — it does not know tax law, and
 *      the architecture should make that obvious rather than implied.
 */
export interface ContributionLimits {
  /** The tax year these figures describe. */
  year: number;
  /** Elective deferral limit for an employer plan (401k-style). */
  electiveDeferralCents: Cents;
  /** Individual retirement account contribution limit. */
  iraCents: Cents;
}

/** Illustrative only — see the warning above. */
export const ILLUSTRATIVE_LIMITS: ContributionLimits = {
  year: 2026,
  electiveDeferralCents: 2_400_000, // $24,000
  iraCents: 750_000, // $7,500
};

/** Total tax-advantaged room across both vehicles. */
export function totalTaxAdvantagedCents(limits: ContributionLimits): Cents {
  return limits.electiveDeferralCents + limits.iraCents;
}
