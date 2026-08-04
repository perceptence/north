import type { TurnId } from "../onboarding/script.ts";
import type { SituationProfile } from "./types.ts";

/**
 * When an answer has aged enough to be worth asking about again.
 *
 * ── THE HALF OF THE LOOP THAT WAS NEVER BUILT ─────────────────────────────
 * The core loop is *coach observes → surfaces one thing → you decide → coach
 * tracks it → checks back*. Two mechanisms already serve the last arrow, and
 * both need the USER to move first: `callbackDue` asks whether a commitment
 * happened, and `catchUpDue` asks what changed after you said you acted. If
 * you never commit to anything, North never speaks about your picture again —
 * it works forever from ten answers given once, with total confidence.
 *
 * That is the failure this closes. A figure has a shelf life, and North knows
 * exactly how old each one is, because `Field.asOf` has always meant "learned
 * OR LAST CONFIRMED".
 *
 * ── FIGURES AGE AT DIFFERENT RATES ────────────────────────────────────────
 * A single horizon would be wrong in both directions: cash moves every month,
 * and how many people depend on you does not. So each correctable answer keeps
 * its own shelf life, set by how fast the underlying thing actually moves. The
 * numbers are deliberately generous — this is a coach noticing, not an audit.
 *
 * ── ONE QUESTION, THE OLDEST ──────────────────────────────────────────────
 * Returns a single turn even when several are stale. A coach that opens with
 * four questions because you have been away is a form, which is the shape this
 * product refuses everywhere else.
 *
 * `now` is a parameter, never a clock read: `core/` is deterministic and every
 * date in the engine comes from the edge (docs/ARCHITECTURE.md).
 */

const DAY = 86_400_000;

/**
 * How long each answer stays fresh, in days.
 *
 * Keyed by the onboarding turn that asks it, so the thing that goes stale and
 * the thing that re-asks it are named by one identifier — the same reason
 * `CORRECTABLE` and `FIELD_BEHIND_RUNG` are keyed that way.
 */
export const SHELF_LIFE_DAYS: Readonly<Record<string, number>> = {
  /** Cash moves every month, and the buffer rung rests entirely on it. */
  liquid: 120,
  /** Spending drifts with life rather than jumping — a season is fair. */
  monthlyOut: 180,
  /** A balance moves as it is paid down; the rate does not. */
  expensiveDebt: 120,
  /** A raise is a yearly event, and the band is coarse enough to absorb one. */
  incomeBand: 365,
  /** Contribution rates change at open enrolment, once a year. */
  retirement: 365,
  employerMatch: 365,
  /** These change with life, not with money. Asking sooner would be noise. */
  dependents: 730,
  horizon: 730,
};

/** The field each correctable turn asks about, for reading its `asOf`. */
const FIELD_FOR_TURN: Partial<
  Record<TurnId, (profile: SituationProfile) => { asOf: string } | undefined>
> = {
  liquid: (p) => p.liquidCents,
  monthlyOut: (p) => p.monthlyOutCents,
  incomeBand: (p) => p.incomeBand,
  retirement: (p) => p.retirementBps,
  employerMatch: (p) => p.employerMatchBps,
  expensiveDebt: (p) => p.obligations,
  dependents: (p) => p.dependents,
  horizon: (p) => p.horizonMonths,
};

export interface StaleAnswer {
  turnId: TurnId;
  /** Whole days since the answer was given or last confirmed. */
  ageDays: number;
}

/**
 * The one answer worth re-asking, or `null` while the picture is current.
 *
 * Ordered by how far PAST its own shelf life each answer is, not by raw age —
 * otherwise `horizon`, which is allowed to be two years old, would always win
 * over cash that went stale last week. Overdue-ness is the honest comparison
 * between things with different lifespans.
 */
export function staleAnswer(
  profile: SituationProfile,
  now: Date,
): StaleAnswer | null {
  let worst: (StaleAnswer & { overdue: number }) | null = null;

  for (const [turnId, read] of Object.entries(FIELD_FOR_TURN)) {
    const field = read?.(profile);
    if (!field) continue;

    const shelf = SHELF_LIFE_DAYS[turnId];
    if (shelf === undefined) continue;

    const at = new Date(field.asOf).getTime();
    // An unreadable date is not "infinitely stale" — it is a record problem,
    // and inventing a question from it would put a bad prompt in the coach's
    // mouth. `parseProfile` refuses these at the boundary anyway.
    if (!Number.isFinite(at)) continue;

    const ageDays = Math.floor((now.getTime() - at) / DAY);
    const overdue = ageDays - shelf;
    if (overdue < 0) continue;

    if (!worst || overdue > worst.overdue) {
      worst = { turnId: turnId as TurnId, ageDays, overdue };
    }
  }

  return worst ? { turnId: worst.turnId, ageDays: worst.ageDays } : null;
}

/**
 * How long ago, in the coach's words.
 *
 * Rounded and vague on purpose. "127 days ago" is a database talking; the
 * point of the sentence is that the figure is OLD, and false precision about
 * staleness would be its own small dishonesty.
 */
export function agePhrase(ageDays: number): string {
  if (ageDays >= 365) {
    const years = Math.floor(ageDays / 365);
    return years === 1 ? "over a year ago" : `over ${years} years ago`;
  }
  if (ageDays >= 60) return `about ${Math.round(ageDays / 30)} months ago`;
  if (ageDays >= 30) return "about a month ago";
  return `${ageDays} days ago`;
}
