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

/**
 * Days left to use this year's room.
 *
 * ── WHY THE ENGINE GETS TO SAY THIS ───────────────────────────────────────
 * The tax-advantaged read already ends *"and it does not roll over"* — a true
 * statement with no consequence attached. The room expires on a date North
 * knows, from a `now` it is already given, so leaving the sentence abstract
 * was leaving arithmetic on the table. It is not a new fact; it is the same
 * fact, dated.
 *
 * Counted to the end of the LIMITS' year rather than the calendar year the
 * clock happens to be in. The room belongs to a tax year, and when the demo
 * runs in a year the fixtures do not describe, the honest answer is that
 * there are no days left in a year that is over — not a countdown against
 * limits for some other year.
 */
export function daysLeftInTaxYear(
  limits: ContributionLimits,
  now: Date,
): number {
  // Midnight UTC on 1 January of the following year — the instant the room
  // is gone. UTC throughout: the engine is deterministic and must not shift
  // its answer with the reader's timezone.
  const expiry = Date.UTC(limits.year + 1, 0, 1);
  const remaining = Math.ceil((expiry - now.getTime()) / 86_400_000);
  return Math.max(0, remaining);
}

/**
 * Whether the deadline is close enough to be worth saying out loud.
 *
 * "320 days to use it" in January is not urgency, it is padding — and this
 * product spends its words carefully. A quarter is the point at which "this
 * expires" stops being a fact about the calendar and starts being a reason to
 * act this month.
 */
export const DEADLINE_SPEAKS_WITHIN_DAYS = 92;
