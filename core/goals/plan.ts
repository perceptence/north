import type { Confidence, Field } from "../confidence.ts";
import type { Cents, Months } from "../money.ts";
import type { Goal, SituationProfile } from "../profile/types.ts";

/**
 * The goal plan — what several goals do to one surplus.
 *
 * ── THE PROBLEM MULTIPLE GOALS CREATE ─────────────────────────────────────
 * A single goal can be measured against the monthly surplus directly. Three
 * cannot: if each is compared against the whole surplus, all three report
 * "your spare covers it" while funding one of them would exhaust it. That is
 * a number that is individually true and collectively a lie, which is exactly
 * the failure this product exists to refuse.
 *
 * So the surplus is ALLOCATED, once, in deadline order — soonest first,
 * because a deadline is the one thing about a goal the user cannot negotiate
 * with. Each goal is then measured against what is genuinely left for it.
 * The second goal sees the first goal's claim already taken.
 *
 * Ties break on the larger target first: two goals in the same month, the
 * bigger one is the one more likely to fail quietly.
 *
 * This is pure arithmetic over `Cents` — no clock, no framework, no rounding
 * into floats.
 */

export interface PlannedGoal {
  goal: Goal;
  confidence: Confidence;
  /** Position in this profile's `goals` list — the identity for edits. */
  index: number;
  /** Still owed. */
  gapCents: Cents;
  /** What it asks for each month, rounded UP to a clean $50. */
  monthlyNeedCents: Cents;
  /** What the surplus can actually give it, after nearer goals took theirs. */
  monthlyCoveredCents: Cents;
  /** What it asks for and cannot get. Zero when the surplus covers it. */
  monthlyShortCents: Cents;
  funded: boolean;
}

export interface GoalPlan {
  /** Every goal, in deadline order — the order the surplus was allocated. */
  goals: PlannedGoal[];
  /** The first unfunded goal, which is the one rung 5 speaks for. */
  primary: PlannedGoal | null;
  /** Surplus left after every goal took what it could. */
  unclaimedCents: Cents;
  /** Total asked for each month, whether or not the surplus can meet it. */
  totalMonthlyNeedCents: Cents;
}

/** A monthly figure with cents is false precision. Clean $50 steps, rounded up. */
function monthlyNeed(gap: Cents, months: Months): Cents {
  if (gap <= 0) return 0;
  if (months <= 0) return gap;
  return Math.ceil(gap / months / 5_000) * 5_000;
}

/**
 * Allocate `surplusCents` across the profile's goals, soonest deadline first.
 *
 * Returns an empty plan when no goals are named — callers never branch on
 * `profile.goals` being absent.
 */
export function planGoals(
  profile: SituationProfile,
  surplusCents: Cents,
): GoalPlan {
  const named = profile.goals ?? [];

  const ordered = named
    .map((field: Field<Goal>, index: number) => ({ field, index }))
    .sort((a, b) => {
      const byDeadline = a.field.value.withinMonths - b.field.value.withinMonths;
      if (byDeadline !== 0) return byDeadline;
      // Same month: the larger target is the one that fails quietly.
      return b.field.value.targetCents - a.field.value.targetCents;
    });

  let remaining = Math.max(0, surplusCents);
  let totalMonthlyNeedCents = 0;

  const goals: PlannedGoal[] = ordered.map(({ field, index }) => {
    const goal = field.value;
    const gapCents = Math.max(0, goal.targetCents - goal.savedCents);
    const needCents = monthlyNeed(gapCents, goal.withinMonths);
    const coveredCents = Math.min(needCents, remaining);

    remaining -= coveredCents;
    totalMonthlyNeedCents += needCents;

    return {
      goal,
      confidence: field.confidence,
      index,
      gapCents,
      monthlyNeedCents: needCents,
      monthlyCoveredCents: coveredCents,
      monthlyShortCents: needCents - coveredCents,
      funded: gapCents === 0,
    };
  });

  return {
    goals,
    primary: goals.find((g) => !g.funded) ?? null,
    unclaimedCents: remaining,
    totalMonthlyNeedCents,
  };
}
