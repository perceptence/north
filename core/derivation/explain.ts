import type { TurnId } from "../onboarding/script.ts";
import type { SituationProfile } from "../profile/types.ts";
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
  | "annualRetirement";

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
  }
}

/** The floor in months, exposed so a caller can name it without recomputing. */
export const LIQUIDITY_FLOOR = {
  alone: THRESHOLDS.liquidityFloorMonths,
  withDependents: THRESHOLDS.liquidityFloorMonthsWithDependents,
} as const;
