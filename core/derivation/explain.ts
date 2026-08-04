import { derived } from "../confidence.ts";
import { shortfall } from "../goals/plan.ts";
import type { TurnId } from "../onboarding/script.ts";
import type { ObligationKind, SituationProfile } from "../profile/types.ts";
import { fig, from, text } from "../prose.ts";
import { totalTaxAdvantagedCents } from "../waterfall/limits.ts";
import { THRESHOLDS } from "../waterfall/derive.ts";
import type {
  DerivedFacts,
  EvaluateOptions,
  ReadSegment,
} from "../waterfall/types.ts";

/**
 * The working behind ONE figure, told as sentences.
 *
 * ── WHAT THIS REPLACES ────────────────────────────────────────────────────
 * Tapping a number opened a sheet listing twelve rows of label, value and
 * confidence — everything North holds, in two tables, regardless of which
 * figure was tapped. It was numbers after numbers, and it answered a question
 * nobody asked: "what do you know" rather than "where did THAT come from".
 *
 * `DerivationSheet` said so itself: *"KNOWN LIMITATION: this shows the whole
 * working, not the provenance of the one figure that was tapped. Per-figure
 * provenance needs the engine to declare inputs per segment."* This is the
 * engine declaring them.
 *
 * ── WHY IT IS PROSE AND NOT A TABLE ───────────────────────────────────────
 * A table asks the reader to do the arithmetic and infer the relationships. A
 * chain of sentences IS the reasoning — each step states one input and what it
 * means, and the last one lands on the number that was tapped. That is the
 * same inversion the whole product runs on (docs/UX-ARCHITECTURE.md §4.3: the
 * interpretation is the hero and the numbers live inside it), applied to the
 * one screen that had reverted to a spreadsheet.
 *
 * UX-ARCHITECTURE calls this "the interaction most likely to convince a
 * skeptical reviewer the reasoning is real". A list of inputs does not
 * convince anyone of anything; showing your working does.
 *
 * ── AND WHY IT LIVES IN `core/` ───────────────────────────────────────────
 * Because it must not be able to drift from the arithmetic it describes. Each
 * step is composed from the SAME `DerivedFacts` and the same thresholds
 * `derive()` used, so a sentence claiming "three months is your floor" cannot
 * outlive a change to `liquidityFloorMonths`. A hand-written explanation in a
 * component is a second copy of the engine's rules, and second copies rot.
 */

/**
 * The figures whose working is worth showing.
 *
 * Only DERIVED values appear here. A figure you simply told North needs no
 * explanation — the answer is "you said so", and the sheet offers to change
 * it instead.
 */
export type DerivationKey =
  | "liquidityMonths"
  | "excessCash"
  | "unusedTaxAdvantaged"
  | "monthlySurplus"
  | "monthlyIncome"
  | "annualRetirement"
  | "costliestObligation"
  | "goalMonthlyNeed";

/**
 * Every figure a read marks `interrogable` MUST name one of these keys.
 *
 * Two did not, and the consequence was invisible in code and obvious in use:
 * the debt rung's balance ("You're carrying $40,000…") and the goal rung's
 * monthly need. `TodayScreen` passes `segment.explains ?? null`, and a null
 * key drops the sheet into the twelve-row fallback table — so on two of the
 * five rungs, tapping the number the coach was talking about produced
 * exactly the spreadsheet this module was written to replace. The rungs a
 * person in trouble actually lands on were the two that fell through.
 *
 * `rules.test.ts` now asserts the pairing, so a new interrogable figure
 * cannot ship without its working.
 */

export interface DerivationStep {
  /** One line of the working, with its figure inside the sentence. */
  segments: ReadSegment[];
  /**
   * The onboarding turn behind this input, when it is the user's to change.
   *
   * This is what makes the overlay a way IN rather than a read-only receipt:
   * the step that is wrong is the step you tap.
   */
  from?: TurnId;
}

export interface Derivation {
  /** What is being explained, in the coach's words. */
  title: string;
  /** The inputs, in the order a person would reason through them. */
  steps: DerivationStep[];
  /** The conclusion — the figure that was tapped, restated as a sentence. */
  result: ReadSegment[];
}

export function explain(
  key: DerivationKey,
  profile: SituationProfile,
  facts: DerivedFacts,
  options: EvaluateOptions,
): Derivation {
  switch (key) {
    case "liquidityMonths":
      return {
        title: "Months your cash covers",
        steps: [
          {
            segments: [
              text("You hold "),
              from(profile.liquidCents, "currency", { label: "in cash" }),
              text(" in cash."),
            ],
            from: "liquid",
          },
          {
            segments: [
              text("You spend about "),
              from(profile.monthlyOutCents, "currency", { label: "a month" }),
              text(" a month."),
            ],
            from: "monthlyOut",
          },
        ],
        result: [
          text("One divided by the other is "),
          fig(facts.liquidityMonths.value, "duration", facts.liquidityMonths.confidence, {
            label: "of cover",
          }),
          text(
            " of cover — rounded down, because two point nine months should " +
              "never present itself as three.",
          ),
        ],
      };

    case "excessCash": {
      const floor = facts.liquidityFloorMonths;
      const dependents = profile.dependents.value;
      return {
        title: "Cash above the floor",
        steps: [
          {
            segments: [
              text("You hold "),
              from(profile.liquidCents, "currency", { label: "in cash" }),
              text(" in cash."),
            ],
            from: "liquid",
          },
          {
            segments: [
              text("You spend about "),
              from(profile.monthlyOutCents, "currency", { label: "a month" }),
              text(" a month."),
            ],
            from: "monthlyOut",
          },
          {
            segments: [
              text(
                dependents > 0
                  ? "With people depending on you, your floor is "
                  : "With nobody depending on you, your floor is ",
              ),
              fig(floor, "duration", "inferred", { label: "of outgoings" }),
              text(" of outgoings — "),
              fig(
                floor * profile.monthlyOutCents.value,
                "currency",
                facts.excessCash.confidence,
                { label: "held back" },
              ),
              text("."),
            ],
            from: "dependents",
          },
        ],
        result: [
          text("Everything past that floor is "),
          fig(facts.excessCash.value, "currency", facts.excessCash.confidence, {
            label: "above the floor",
          }),
          text(", which is the part with nothing asked of it."),
        ],
      };
    }

    case "monthlyIncome":
      return {
        title: "Monthly income",
        steps: [
          {
            segments: [
              text("You picked an income band rather than a figure."),
            ],
            from: "incomeBand",
          },
        ],
        result: [
          text("North works from its midpoint — about "),
          fig(facts.monthlyIncome.value, "currency", facts.monthlyIncome.confidence, {
            label: "a month",
          }),
          text(
            " a month. That is why everything resting on it is marked as an " +
              "assumption rather than something you said.",
          ),
        ],
      };

    case "annualRetirement":
      return {
        title: "Going to retirement",
        steps: [
          {
            segments: [
              text("Your band puts you at about "),
              fig(facts.monthlyIncome.value, "currency", facts.monthlyIncome.confidence, {
                label: "a month",
              }),
              text(" a month."),
            ],
            from: "incomeBand",
          },
          {
            segments: [
              text("You told us "),
              from(profile.retirementBps, "percent", { label: "of it" }),
              text(" of it goes to retirement."),
            ],
            from: "retirement",
          },
        ],
        result: [
          text("Over a year that is "),
          fig(facts.annualRetirement.value, "currency", facts.annualRetirement.confidence, {
            label: "a year",
          }),
          text("."),
        ],
      };

    case "unusedTaxAdvantaged":
      return {
        title: "Tax-advantaged room unused",
        steps: [
          {
            segments: [
              text("The accounts you can shelter money in hold "),
              fig(totalTaxAdvantagedCents(options.limits), "currency", "assumed", {
                label: "this year",
              }),
              text(" this year."),
            ],
          },
          {
            segments: [
              text("At "),
              from(profile.retirementBps, "percent", { label: "of your income" }),
              text(" of your income you are putting in about "),
              fig(facts.annualRetirement.value, "currency", facts.annualRetirement.confidence, {
                label: "a year",
              }),
              text("."),
            ],
            from: "retirement",
          },
        ],
        result: [
          text("Which leaves "),
          fig(
            facts.unusedTaxAdvantaged.value,
            "currency",
            facts.unusedTaxAdvantaged.confidence,
            { label: "unused" },
          ),
          text(" of it unused — and it does not roll over."),
        ],
      };

    case "monthlySurplus":
      return {
        title: "Spare each month",
        steps: [
          {
            segments: [
              text("About "),
              fig(facts.monthlyIncome.value, "currency", facts.monthlyIncome.confidence, {
                label: "comes in" ,
              }),
              text(" comes in."),
            ],
            from: "incomeBand",
          },
          {
            segments: [
              text("About "),
              from(profile.monthlyOutCents, "currency", { label: "goes out" }),
              text(" goes out."),
            ],
            from: "monthlyOut",
          },
          {
            segments: [
              text("And about "),
              fig(
                Math.round(facts.annualRetirement.value / 12),
                "currency",
                facts.annualRetirement.confidence,
                { label: "to retirement" },
              ),
              text(" goes to retirement before you see it."),
            ],
            from: "retirement",
          },
        ],
        result: [
          text("What is left is "),
          fig(facts.monthlySurplus.value, "currency", facts.monthlySurplus.confidence, {
            label: "spare each month",
          }),
          text("."),
        ],
      };

    /**
     * The balance the debt rung speaks about.
     *
     * The interesting question here is not the arithmetic — there is none —
     * but WHICH debt this is and why the figure is marked assumed when the
     * user picked the amount themselves. Both have honest answers, and both
     * were previously unreachable: the rate is North's, and the rate is what
     * chooses the debt.
     */
    case "costliestObligation": {
      const worst = facts.costliestObligation.value;

      // Unreachable from the rung, which only speaks when a debt exists.
      // Total rather than relying on that.
      if (worst === null) {
        return {
          title: "Expensive debt",
          steps: [],
          result: [
            text("Nothing you told us about is charging serious interest."),
          ],
        };
      }

      return {
        title: "The debt that comes first",
        steps: [
          {
            segments: [
              text(`You told us ${DEBT_WORD[worst.kind]} is charging you serious interest, with about `),
              fig(worst.balanceCents, "currency", profile.obligations.confidence, {
                label: "on it",
              }),
              text(" on it."),
            ],
            from: "expensiveDebt",
          },
          {
            segments: [
              text("You did not tell us its rate, so North assumes "),
              fig(worst.rateBps, "percent", "assumed", { label: "a year" }),
              text(
                " a year for that kind of debt. That guess is the reason this " +
                  "figure is marked as an assumption even though the amount is " +
                  "yours.",
              ),
            ],
          },
          {
            segments: [
              text("Anything at or above "),
              fig(THRESHOLDS.highInterestBps, "percent", "assumed", {
                label: "a year",
              }),
              text(
                " a year costs more, reliably, than investing is expected to " +
                  "return.",
              ),
            ],
          },
        ],
        result: [
          text("So this is the balance to clear first — "),
          fig(worst.balanceCents, "currency", facts.costliestObligation.confidence, {
            label: "to clear first",
          }),
          text(
            ". Where you carry more than one debt the RATE decides the order, " +
              "never the size: a larger mortgage at a low rate is not what " +
              "comes first.",
          ),
        ],
      };
    }

    /**
     * What the nearest under-funded goal asks for each month.
     *
     * Read against `shortfall`, the same query the rung used to choose which
     * goal it is speaking for — one definition, so the sentence and the read
     * above it can never be about different goals.
     */
    case "goalMonthlyNeed": {
      const primary = shortfall(profile, facts.monthlySurplus.value);

      if (primary === null) {
        return {
          title: "What this goal asks",
          steps: [],
          result: [text("Nothing is waiting on funding.")],
        };
      }

      const { goal } = primary;

      return {
        title: `What ${goal.label} asks each month`,
        steps: [
          {
            segments: [
              text(`${goal.label} needs `),
              fig(goal.targetCents, "currency", primary.confidence, {
                label: "in total",
              }),
              text(" in total, and "),
              fig(goal.savedCents, "currency", primary.confidence, {
                label: "already saved",
              }),
              text(" is already there."),
            ],
          },
          {
            segments: [
              text("That leaves "),
              fig(primary.gapCents, "currency", primary.confidence, {
                label: "still to find",
              }),
              text(" to find, and "),
              fig(goal.withinMonths, "duration", primary.confidence, {
                label: "to find it in",
              }),
              text(" to find it in."),
            ],
          },
        ],
        result: [
          text("Spread evenly that is "),
          fig(primary.monthlyNeedCents, "currency", derived(primary.confidence), {
            label: "a month",
          }),
          text(
            " a month — rounded UP to a clean fifty, because a target that " +
              "rounds down is one you can hit every month and still miss.",
          ),
        ],
      };
    }
  }
}

/** How the coach names a kind of debt in a sentence. */
const DEBT_WORD: Record<ObligationKind, string> = {
  card: "a credit card",
  auto: "a car loan",
  student: "a student loan",
  mortgage: "a mortgage",
  other: "something",
};

/** The floor in months, exposed so a caller can name it without recomputing. */
export const LIQUIDITY_FLOOR = {
  alone: THRESHOLDS.liquidityFloorMonths,
  withDependents: THRESHOLDS.liquidityFloorMonthsWithDependents,
} as const;
