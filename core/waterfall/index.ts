/**
 * The Waterfall engine — North's intelligence.
 *
 * Pure TypeScript. No React, no Next, no DOM, no clock, no network.
 * See docs/WATERFALL.md for the rules and the assumptions behind them.
 */

export { evaluate, readToPlainText } from "./evaluate.ts";
export { costliest, derive, THRESHOLDS } from "./derive.ts";
export { RUNGS, WATERFALL_LENGTH, rungById } from "./rules.ts";
export {
  ILLUSTRATIVE_LIMITS,
  totalTaxAdvantagedCents,
  type ContributionLimits,
} from "./limits.ts";
export type {
  DerivedFacts,
  Evaluation,
  EvaluateOptions,
  Read,
  ReadSegment,
  Rung,
  RungContext,
  RungId,
  RungState,
} from "./types.ts";
