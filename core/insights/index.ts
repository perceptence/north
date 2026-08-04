/**
 * Insights — the coach reflecting, in prose.
 *
 * See core/insights/types.ts for what this can and cannot honestly claim.
 */

export { BASELINE_MIN_DAYS, pickBaseline } from "./baseline.ts";
export { observe, blindSpots } from "./observe.ts";
export { composeLetter, letterSegments } from "./letter.ts";
export type { ChangeKind, Direction, Letter, LetterEntry } from "./letter.ts";
export type {
  Insight,
  InsightKind,
  InsightsReport,
  LadderProgress,
} from "./types.ts";
