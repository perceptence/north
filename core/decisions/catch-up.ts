import { FIELD_BEHIND_RUNG } from "../onboarding/correction.ts";
import type { TurnId } from "../onboarding/script.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { Decision } from "./types.ts";

/**
 * The question North owes you after you said you did something.
 *
 * ── THE PROMISE THE LEDGER WAS MAKING AND NOT KEEPING ─────────────────────
 * Resolving a commitment on the Decisions screen prints, in the coach's own
 * voice: *"Recorded. North will ask what changed next time you're on Today,
 * so the picture it has of you keeps up."* Nothing recorded that intent.
 * `resolveDecision` writes an outcome and a timestamp and nothing else, and
 * the only thing that ever opened the correction sheet was a click handler
 * inside Today's own callback branch — so resolving anywhere ELSE, which on
 * the demo path is the only way to reach `held` at all, dropped the promise
 * silently. The user was told a thing would happen and it did not.
 *
 * ── DERIVED, NOT PARKED ───────────────────────────────────────────────────
 * The obvious fix is to set a flag when a decision resolves and read it on
 * the next screen. That would mean carrying UI state across a navigation,
 * and it would be wrong the moment anything resolved a decision without
 * going through that one handler.
 *
 * This asks the question directly instead: **is any profile field older than
 * the commitment that should have changed it?** That is true exactly when
 * North's picture has fallen behind, it is true no matter which screen
 * resolved the decision, and it stops being true the moment the correction is
 * answered — because `applyAnswers` re-stamps `asOf` to now. There is no flag
 * to set, clear, or forget to clear.
 *
 * `core/decisions/types.ts` names this as the outstanding work: *"PROPER FIX
 * for the `held` case is the correction loop … Until that exists, skipping is
 * the honest behaviour."* This is that fix.
 */

/**
 * The field each correctable turn asks about.
 *
 * Mirrors `applyAnswers`, which is the authoritative direction — that
 * function decides which field a turn WRITES, and this one has to read the
 * same field or the catch-up would never clear. Kept adjacent in review terms
 * rather than derived from it, because `applyAnswers` maps answers to values
 * and this maps turns to freshness; one is not expressible as the other.
 */
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

/**
 * The one turn worth re-asking, or null when the picture is current.
 *
 * Decisions arrive newest-first from the store, so the first match is the
 * most recent thing the profile has not caught up with — one question, not a
 * queue. A coach that opens with four questions because you had a productive
 * month is a form.
 */
export function catchUpDue(
  profile: SituationProfile,
  decisions: readonly Decision[],
): TurnId | null {
  for (const decision of decisions) {
    // Only "I did it" implies the situation moved. A deferral changes
    // nothing about the profile, and an open commitment has not happened yet.
    if (decision.outcome !== "held") continue;

    const turnId = FIELD_BEHIND_RUNG[decision.rungId];
    // Null where holding the decision changes nothing North asked about —
    // there is no point interrupting someone to re-ask a question whose
    // answer is the same.
    if (!turnId) continue;

    const field = FIELD_FOR_TURN[turnId]?.(profile);
    if (!field) continue;

    const settledAt = decision.resolvedAt ?? decision.decidedAt;
    if (new Date(field.asOf).getTime() < new Date(settledAt).getTime()) {
      return turnId;
    }
  }
  return null;
}
