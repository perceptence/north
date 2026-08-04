import { weakest, type Field } from "../confidence.ts";
import type { BasisPoints, Cents, Months } from "../money.ts";
import type {
  FinancialConfidence,
  IncomeBand,
  Obligation,
  ObligationKind,
  SituationProfile,
} from "../profile/types.ts";
import { visibleTurns, type Answers, type TurnId } from "./script.ts";

/**
 * Conversation answers → a valid `SituationProfile`.
 *
 * The one place raw answers become the typed object the engine reasons over.
 * Keeping it in `core/` means it is testable without a renderer, and means the
 * screen never constructs a profile by hand.
 */

/**
 * Assumed annual rates for debt whose rate we never asked for.
 *
 * We ask what KIND of debt it is, not what it charges — nobody knows their APR
 * off-hand, and asking makes the conversation feel like an application form.
 * So the rate is North's assumption, marked as such, which is exactly what
 * makes it correctable later: it renders dashed and interrogable, and tapping
 * it re-asks (docs/UX-ARCHITECTURE.md §5.3).
 */
const ASSUMED_RATE_BPS: Record<"card" | "other" | "unsure", BasisPoints> = {
  card: 2_200,
  other: 1_200,
  /** Unknown consumer debt. Deliberately above the high-interest threshold so
   *  it surfaces for confirmation rather than staying silently invisible. */
  unsure: 1_500,
};

const DEBT_KIND: Record<"card" | "other" | "unsure", ObligationKind> = {
  card: "card",
  other: "other",
  unsure: "other",
};

/** Every turn that must be answered, given the answers so far. */
export function missingAnswers(answers: Answers): TurnId[] {
  return visibleTurns(answers)
    .filter((turn) => answers[turn.id] === undefined)
    .map((turn) => turn.id);
}

export function isComplete(answers: Answers): boolean {
  return missingAnswers(answers).length === 0;
}

export function buildProfile(answers: Answers, now: Date): SituationProfile {
  const missing = missingAnswers(answers);
  if (missing.length > 0) {
    throw new Error(
      `Cannot build a profile — unanswered: ${missing.join(", ")}. ` +
        `Check isComplete() before calling buildProfile().`,
    );
  }

  const asOf = now.toISOString();

  /** Lifts a recorded answer into a profile field, keeping its confidence. */
  const at = <T>(id: TurnId): Field<T> => {
    const answer = answers[id]!;
    return { value: answer.value as T, confidence: answer.confidence, asOf };
  };

  const debt = answers.expensiveDebt!;
  const debtKey = debt.value as keyof typeof ASSUMED_RATE_BPS;
  const hasDebt = debt.value !== "none";

  const obligations: Obligation[] = hasDebt
    ? [
        {
          kind: DEBT_KIND[debtKey] ?? "other",
          balanceCents: answers.debtBalance!.value as Cents,
          rateBps: ASSUMED_RATE_BPS[debtKey] ?? ASSUMED_RATE_BPS.other,
        },
      ]
    : [];

  return {
    openingConcern: at<string>("openingConcern"),
    financialConfidence: at<FinancialConfidence>("confidence"),
    incomeBand: at<IncomeBand>("incomeBand"),
    liquidCents: at<Cents>("liquid"),
    monthlyOutCents: at<Cents>("monthlyOut"),
    obligations: {
      value: obligations,
      // "No expensive debt" is something the user told us. But once debt
      // exists, the RATE is ours — so the field is only as good as its weakest
      // part.
      confidence: hasDebt
        ? weakest("assumed", answers.debtBalance!.confidence)
        : debt.confidence,
      asOf,
    },
    dependents: at<number>("dependents"),
    retirementBps: at<BasisPoints>("retirement"),
    employerMatchBps: at<BasisPoints>("employerMatch"),
    horizonMonths: at<Months>("horizon"),
  };
}
