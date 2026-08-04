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
 * How long a deferral holds before the rung may be raised again.
 *
 * ── "NOT NOW" IS NOT "NEVER" ──────────────────────────────────────────────
 * A deferral used to settle a rung permanently, which quietly made the product
 * lie in four places at once: `summariseLedger` has the coach say *"North will
 * raise it again when it matters"*, `OutcomeMark` draws deferral as a
 * returning loop, docs/UX-ARCHITECTURE.md calls the return a hard constraint
 * rather than a nicety, and the same document promises the item "reappears
 * later, once, phrased as new". None of that was true: waving something off
 * once removed it from the ladder for good, and in the seeded demo
 * high-interest debt could never be mentioned again.
 *
 * A month is the interval because it is the one a person actually lives on —
 * pay arrives, the balance moves, and "not now" plausibly becomes "now". Short
 * enough that the coach is still paying attention, long enough that being
 * asked again does not read as nagging, which is the failure the permanent
 * skip was over-correcting for.
 */
export const DEFER_HOLDS_DAYS = 30;

const DAY = 86_400_000;

/**
 * Rungs that already have an answer, and so should not be asked about now.
 *
 * The two outcomes settle for different reasons and on different clocks:
 *
 *   deferred — the user waved it off. Re-surfacing it immediately is nagging,
 *              and it trains people to stop answering honestly. So it holds
 *              for `DEFER_HOLDS_DAYS` and then the rung returns, because a
 *              decision declined in March is not declined forever.
 *
 *   held     — the user said they did it. North's profile has not caught up
 *              (nothing re-asked for their new contribution rate), so the
 *              engine would otherwise keep surfacing the same decision to
 *              someone who has already acted on it. This one does NOT expire:
 *              re-asking would not be a fresh offer, it would be the coach
 *              forgetting.
 *
 * PROPER FIX for the `held` case is the correction loop
 * (docs/UX-ARCHITECTURE.md §5.3): acting on a decision should re-ask the field
 * it changed, so the profile actually catches up. Until that exists, skipping
 * is the honest behaviour — the alternative is a coach that ignores you.
 *
 * `now` is a parameter rather than a clock read, because `core/` never reads
 * the time itself — every date in the engine is derived from a `now` the edge
 * supplies (docs/ARCHITECTURE.md, determinism).
 */
export function settledRungIds(decisions: Decision[], now: Date): RungId[] {
  const deferralCutoff = now.getTime() - DEFER_HOLDS_DAYS * DAY;
  return decisions
    .filter((d) => {
      if (d.outcome === "held") return true;
      if (d.outcome !== "deferred") return false;
      // Dated from when it was WAVED OFF, not when it was first surfaced —
      // `resolvedAt` is when the user actually said "not now".
      const at = new Date(d.resolvedAt ?? d.decidedAt).getTime();
      return at > deferralCutoff;
    })
    .map((d) => d.rungId);
}
