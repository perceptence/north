/**
 * Insights — the coach reflecting, in prose.
 *
 * See core/insights/types.ts for what this can and cannot honestly claim.
 */

export { observe, blindSpots } from "./observe.ts";
export { composeLetter } from "./letter.ts";
export type { ChangeKind, Direction, Letter, LetterEntry } from "./letter.ts";
export type {
  Insight,
  InsightKind,
  InsightsReport,
  LadderProgress,
} from "./types.ts";
