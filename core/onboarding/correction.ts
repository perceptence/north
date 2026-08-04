import { weakest, type Field } from "../confidence.ts";
import type { BasisPoints, Cents, Months } from "../money.ts";
import type {
  FinancialConfidence,
  Goal,
  IncomeBand,
  Obligation,
  SituationProfile,
} from "../profile/types.ts";
import type { RungId } from "../waterfall/types.ts";
import type { Answers, TurnId } from "./script.ts";

/**
 * Correcting what North knows.
 *
 * ── WHY THERE IS NO SETTINGS SCREEN ───────────────────────────────────────
 * North states things about someone's situation. When one of those is wrong and
 * they cannot fix it, they leave — and they are right to. But a settings form
 * would undercut the entire thesis: the product's claim is that conversation is
 * the interface.
 *
 * So a correction is a ONE-QUESTION CONVERSATION. The same turn from onboarding,
 * asked again, patched onto the profile (docs/UX-ARCHITECTURE.md §5.3). That
 * reuse is what removes a whole surface from the IA.
 *
 * ── AND WHY IT MATTERS BEYOND TYPOS ───────────────────────────────────────
 * Acting on a decision doesn't change what North knows. Someone who raises their
 * contribution rate is still described by the old one, so the engine keeps
 * surfacing a decision they already took. This is the mechanism that lets the
 * profile catch up.
 */

/** Fields the user can correct, and the turn that asks about each. */
export const CORRECTABLE: ReadonlyArray<{ turnId: TurnId; label: string }> = [
  { turnId: "liquid", label: "Cash you hold" },
  { turnId: "monthlyOut", label: "Monthly outgoings" },
  { turnId: "incomeBand", label: "Household income" },
  { turnId: "retirement", label: "Going to retirement" },
  { turnId: "employerMatch", label: "Employer match" },
  { turnId: "expensiveDebt", label: "Expensive debt" },
  { turnId: "dependents", label: "People depending on you" },
  { turnId: "horizon", label: "Time horizon" },
] as const;

export function isCorrectable(turnId: TurnId): boolean {
  return CORRECTABLE.some((c) => c.turnId === turnId);
}

/**
 * After acting on a decision, the field most likely to have changed.
 *
 * `null` where holding the decision changes nothing North asked about — there
 * is no point interrupting someone to re-ask a question with the same answer.
 */
export const FIELD_BEHIND_RUNG: Record<RungId, TurnId | null> = {
  liquidity: "liquid",
  match: "retirement",
  "high-interest-debt": "expensiveDebt",
  "tax-advantaged": "retirement",
  goal: null,
  taxable: null,
  optimization: "liquid",
};

const ASSUMED_RATE_BPS: Record<string, BasisPoints> = {
  card: 2_200,
  other: 1_200,
  unsure: 1_500,
};

const DEBT_KIND: Record<string, Obligation["kind"]> = {
  card: "card",
  other: "other",
  unsure: "other",
};

/**
 * Patch answers onto an existing profile.
 *
 * Only the fields present in `answers` change; everything else is left exactly
 * as it was, including its original `asOf`. A correction is a small edit, not a
 * rebuild — re-stamping untouched fields would quietly claim they were
 * reconfirmed.
 */
export function applyAnswers(
  profile: SituationProfile,
  answers: Answers,
  now: Date,
): SituationProfile {
  const asOf = now.toISOString();
  const next: SituationProfile = { ...profile };

  const lift = <T>(turnId: TurnId): Field<T> => {
    const answer = answers[turnId]!;
    return { value: answer.value as T, confidence: answer.confidence, asOf };
  };

  if (answers.openingConcern) next.openingConcern = lift<string>("openingConcern");
  if (answers.confidence)
    next.financialConfidence = lift<FinancialConfidence>("confidence");
  if (answers.incomeBand) next.incomeBand = lift<IncomeBand>("incomeBand");
  if (answers.liquid) next.liquidCents = lift<Cents>("liquid");
  if (answers.monthlyOut) next.monthlyOutCents = lift<Cents>("monthlyOut");
  if (answers.dependents) next.dependents = lift<number>("dependents");
  if (answers.retirement) next.retirementBps = lift<BasisPoints>("retirement");
  if (answers.employerMatch)
    next.employerMatchBps = lift<BasisPoints>("employerMatch");
  if (answers.horizon) next.horizonMonths = lift<Months>("horizon");
  // "Call me something else" is the sanctioned correction for identity —
  // the same one-question conversation every other field gets. An empty
  // name answer withdraws it.
  if (answers.name) {
    const said = String(answers.name.value).replace(/\s+/g, " ").trim().slice(0, 40);
    if (said) {
      next.name = { value: said, confidence: answers.name.confidence, asOf };
    } else {
      delete next.name;
    }
  }
  // Re-acknowledging the terms restamps them — the record is "last agreed",
  // not "first agreed".
  if (answers.consent) next.consent = { at: asOf };

  if (answers.expensiveDebt) {
    const kind = answers.expensiveDebt.value as string;

    if (kind === "none") {
      next.obligations = {
        value: [],
        confidence: answers.expensiveDebt.confidence,
        asOf,
      };
    } else {
      // A balance may not be re-asked — keep whatever we already had rather
      // than zeroing something the user never denied.
      const balance =
        (answers.debtBalance?.value as Cents | undefined) ??
        profile.obligations.value[0]?.balanceCents ??
        0;

      next.obligations = {
        value: [
          {
            kind: DEBT_KIND[kind] ?? "other",
            balanceCents: balance,
            rateBps: ASSUMED_RATE_BPS[kind] ?? ASSUMED_RATE_BPS.other,
          },
        ],
        // The rate is still ours, so the field can be no better than assumed.
        confidence: weakest(
          "assumed",
          answers.debtBalance?.confidence ?? "stated",
        ),
        asOf,
      };
    }
  }

  // The goal turns arrive together — the Goals surface asks all four before
  // saving. The field's confidence is the weakest answer's, so "no date yet"
  // honestly degrades that goal to assumed.
  //
  // A goal is APPENDED, never assigned: naming a second thing you're working
  // toward must not silently discard the first. Editing an existing one is a
  // separate, explicit call (`replaceGoal`).
  if (
    answers.goalLabel &&
    answers.goalTarget &&
    answers.goalWhen &&
    answers.goalSaved
  ) {
    const goal: Goal = {
      label: String(answers.goalLabel.value),
      targetCents: answers.goalTarget.value as Cents,
      withinMonths: answers.goalWhen.value as Months,
      savedCents: answers.goalSaved.value as Cents,
    };
    const field: Field<Goal> = {
      value: goal,
      confidence: weakest(
        answers.goalLabel.confidence,
        answers.goalTarget.confidence,
        answers.goalWhen.confidence,
        answers.goalSaved.confidence,
      ),
      asOf,
    };
    next.goals = [...(profile.goals ?? []), field];
  }

  return next;
}

/**
 * Drop one goal, addressed by its position in the list.
 *
 * Adding something you can never remove is a trap, and the correction loop's
 * whole premise is that what North knows can be fixed. An out-of-range index
 * returns the profile untouched rather than throwing — the caller is a click
 * handler, not a transaction.
 */
/**
 * Change one goal, addressed by its position in the list.
 *
 * Naming a goal is a commitment, and commitments move — a date slips, a target
 * turns out to have been a guess. Without this the only correction available
 * was to let the goal go and name it again, which loses what was already set
 * aside and reads as a punishment for having been wrong. The correction loop's
 * premise is that what North knows can be FIXED, not just deleted.
 *
 * Patch semantics: fields omitted from `changes` keep their current values, so
 * moving a deadline never silently resets a target. An out-of-range index
 * returns the profile untouched rather than throwing — the caller is a click
 * handler, not a transaction.
 */
export function updateGoal(
  profile: SituationProfile,
  index: number,
  changes: Partial<Goal>,
  now: Date,
): SituationProfile {
  const goals = profile.goals ?? [];
  if (index < 0 || index >= goals.length) return profile;

  return {
    ...profile,
    goals: goals.map((field, i) =>
      i === index
        ? {
            // The user has just said this out loud, so the field is `stated`
            // and freshly dated however it was held before — an adjustment
            // that left an old `assumed` in place would keep drawing dashes
            // under a number the user themselves supplied.
            value: { ...field.value, ...changes },
            confidence: "stated" as const,
            asOf: now.toISOString(),
          }
        : field,
    ),
  };
}

export function removeGoal(
  profile: SituationProfile,
  index: number,
): SituationProfile {
  const goals = profile.goals ?? [];
  if (index < 0 || index >= goals.length) return profile;

  const remaining = goals.filter((_, i) => i !== index);
  const next: SituationProfile = { ...profile };
  // Absent, never `[]` — "no goals named" and "a list that happens to be
  // empty" must not be two different states downstream.
  if (remaining.length === 0) delete next.goals;
  else next.goals = remaining;
  return next;
}
