import type { Cents } from "../money.ts";
import type { RungId } from "../waterfall/types.ts";

/**
 * A decision the user made, and what became of it.
 *
 * ── THE GUILT CONSTRAINT, ENFORCED BY THE TYPE SYSTEM ─────────────────────
 * There is no `"failed"`, `"missed"`, or `"overdue"`. A commitment that wasn't
 * acted on returns to `"open"` and the coach re-asks, because there is no other
 * state it can occupy.
 *
 * This is deliberate rather than incidental. Guilt is the category's defining
 * retention failure — a product that keeps a scorecard of your failures is the
 * one you delete (docs/STRATEGY.md §3, P3). A product rule that cannot be
 * violated is worth more than one written in a document.
 */
export type DecisionOutcome = "open" | "held" | "deferred";

export interface Decision {
  id: string;
  /** Which rung surfaced it. */
  rungId: RungId;
  /** What was decided, in the coach's words. */
  summary: string;
  outcome: DecisionOutcome;
  /** ISO timestamp. */
  decidedAt: string;
  /** ISO timestamp, once it stopped being open. */
  resolvedAt?: string;
  /** The figure at stake, if there was one. */
  amountCents?: Cents;
}

/** The one commitment awaiting an answer, if any. */
export function openDecision(decisions: Decision[]): Decision | null {
  return decisions.find((d) => d.outcome === "open") ?? null;
}

/**
 * Rungs that already have an answer, and so should not be asked about again.
 *
 * Covers BOTH outcomes, for different reasons:
 *
 *   deferred — the user waved it off. Re-surfacing it is nagging, and it trains
 *              people to stop answering honestly.
 *
 *   held     — the user said they did it. North's profile has not caught up
 *              (nothing re-asked for their new contribution rate), so the
 *              engine would otherwise keep surfacing the same decision to
 *              someone who has already acted on it.
 *
 * PROPER FIX for the `held` case is the correction loop
 * (docs/UX-ARCHITECTURE.md §5.3): acting on a decision should re-ask the field
 * it changed, so the profile actually catches up. Until that exists, skipping
 * is the honest behaviour — the alternative is a coach that ignores you.
 */
export function settledRungIds(decisions: Decision[]): RungId[] {
  return decisions
    .filter((d) => d.outcome === "deferred" || d.outcome === "held")
    .map((d) => d.rungId);
}
