import type { Field } from "../confidence.ts";
import type { BasisPoints, Cents, Months } from "../money.ts";

/**
 * Everything North knows about a person's situation.
 *
 * Built through conversation, never through a form and never through a persona
 * picker (docs/STRATEGY.md §2). Every value is wrapped in `Field<T>` so the
 * engine always knows how well it knows something.
 *
 * There is deliberately no `unknown` variant. A field North hasn't learned is
 * ABSENT — optional at the type level — and absence renders as a question the
 * coach hasn't asked yet, never as a blank, a dash, or a zero
 * (docs/UX-ARCHITECTURE.md §7.3).
 */

export type IncomeBand = "under-100k" | "100k-200k" | "200k-400k" | "over-400k";

/**
 * How the person feels about their own handle on money.
 *
 * Deliberately NOT an input to the Waterfall — it changes nothing about which
 * rung someone is on, and it must not. It exists to set the coach's TONE.
 *
 * This is the emotional column of the jobs-to-be-done (docs/STRATEGY.md §4),
 * which is where every competitor loses. Someone who feels lost and someone who
 * feels confident can be standing on exactly the same rung and need to be
 * spoken to differently.
 */
export type FinancialConfidence =
  | "lost"
  | "unsure"
  | "mostly-ok"
  | "confident";

export type ObligationKind =
  | "student"
  | "auto"
  | "card"
  | "mortgage"
  | "other";

export interface Obligation {
  kind: ObligationKind;
  balanceCents: Cents;
  /** Annual interest rate. 2200 === 22.00% */
  rateBps: BasisPoints;
}

/**
 * A funded target. Onboarding never collects one (docs/STRATEGY.md §8) — the
 * Goals surface starts that conversation when the user is ready.
 */
export interface Goal {
  label: string;
  targetCents: Cents;
  /** Months from `now` by which the target should be met. */
  withinMonths: Months;
  /** What has already been set aside toward it. */
  savedCents: Cents;
}

export interface SituationProfile {
  /**
   * The user's own words, captured verbatim and NEVER parsed. It is reflected
   * back at the reveal, which is why the user feels heard — and it requires no
   * model call to do that job.
   */
  openingConcern: Field<string>;


  incomeBand: Field<IncomeBand>;
  /** Cash and cash equivalents available today. */
  liquidCents: Field<Cents>;
  /** Total monthly outgoings. */
  monthlyOutCents: Field<Cents>;
  obligations: Field<Obligation[]>;
  dependents: Field<number>;
  /** Share of income going to retirement. 600 === 6.00% */
  retirementBps: Field<BasisPoints>;
  /** Employer match ceiling, as a share of income. 0 when none is offered. */
  employerMatchBps: Field<BasisPoints>;
  /** Months until the user's primary horizon. */
  horizonMonths: Field<Months>;
  /** Sets the coach's tone. Never reaches the Waterfall. */
  financialConfidence: Field<FinancialConfidence>;

  /**
   * Everything the person is working toward, in the order they named them.
   *
   * A LIST, and each entry carries its OWN confidence and `asOf` — a goal
   * named today with a firm date is `stated`, one added later with "no date
   * yet" is `assumed`, and collapsing them into one field would launder the
   * difference. Absent (never `[]`) until the first goal is named.
   *
   * They compete: one surplus funds all of them, so the engine allocates it
   * in deadline order rather than letting every goal claim the same dollar.
   * See `core/goals/plan.ts`.
   */
  goals?: Field<Goal>[];
}
