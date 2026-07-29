import type { Confidence } from "../confidence.ts";
import type { BasisPoints, Cents, FigureFormat, Months } from "../money.ts";

/**
 * A projected range at the user's horizon.
 *
 * Never a point estimate. A projection reading "$1,247,832 at 65" is obviously
 * fabricated to anyone who considers it for two seconds, and the moment a user
 * notices, every other number in the product becomes suspect
 * (docs/STRATEGY.md §3, P6).
 */
export interface Projection {
  /** Pessimistic end of the range. */
  lowCents: Cents;
  /** The central estimate. Exposed for tests and ordering checks — NOT for display. */
  centralCents: Cents;
  /** Optimistic end of the range. */
  highCents: Cents;
  /**
   * The label a `Figure` will carry. Weakest of the inputs, capped at
   * `inferred` — this answers "how good is this number?"
   */
  confidence: Confidence;
  /**
   * How much wider than the base market range this band is drawn, because of
   * how well North knows the person. 1.0 = North knows everything it needs.
   *
   * This answers a DIFFERENT question from `confidence` — "how much of the
   * picture is solid?" rather than "how good is the worst input?" — which is
   * why it blends across inputs instead of taking the weakest.
   */
  spreadMultiplier: number;
  horizonMonths: Months;
  /** What the number rests on. Rendered by the Assumptions sheet. */
  assumptions: ProjectionAssumption[];
}

/**
 * One disclosed assumption.
 *
 * Returned as data rather than written as prose in the sheet, so the disclosure
 * cannot drift away from the maths that produced the number. This is the
 * HorizonBand's table-view twin (docs/DESIGN-SYSTEM.md §8.4).
 */
export interface ProjectionAssumption {
  label: string;
  /** Omitted for assumptions that are purely qualifying statements. */
  value?: number;
  format?: FigureFormat;
  confidence: Confidence;
}

export interface ReturnRange {
  /** Real (inflation-adjusted) annual returns, in basis points. */
  lowBps: BasisPoints;
  midBps: BasisPoints;
  highBps: BasisPoints;
}
