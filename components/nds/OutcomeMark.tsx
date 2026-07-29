"use client";

import type { DecisionOutcome } from "@/core/decisions";
import { cn } from "@/lib/cn";

/**
 * The outcome mark for a decision: held, set aside, or waiting on you.
 *
 * ── ONE SET OF MARKS, NOT TWO ─────────────────────────────────────────────
 * `Row` used to draw its own — a tick, a bare MINUS for deferred, and a ring —
 * while the ledger drew a different three. Two vocabularies for one concept,
 * and the gallery was documenting the set the product does not use. Worse, the
 * minus was the exact shape rejected in review for reading as deletion.
 *
 * This lives in NDS so both can share it. It reads `DecisionOutcome` from core,
 * which is the same direction `Figure` already reaches for `Confidence`.
 *
 * ── ROWS, NOT CARDS — AND NOT A TIMELINE EITHER ───────────────────────────
 * History is rows; that contrast is load-bearing (DESIGN-SYSTEM §8.3). A
 * timeline spine was tried and removed: a timeline's job is to show INTERVAL,
 * and a ledger of a few decisions a year has no interval worth drawing, so the
 * line was decoration carrying no fact. The statement treatment on
 * DecisionsScreen is what replaced it.
 *
 * ── NOTHING HERE CELEBRATES ───────────────────────────────────────────────
 * No streak, no badge, no count animating upward, no colour shift to "done".
 * The pride on this screen is the coach's sentence at the top and the fact
 * that the record is worth reading; a scoreboard would cut both ways, and the
 * first broken run would manufacture the exact guilt the screen exists to
 * remove.
 *
 * The marks are fully drawn from the first frame and enter on `y` with their
 * row — motion never gates visibility for anything carrying information
 * (components/nds/motion.ts). A draw-on stroke would have looked lovely and
 * rendered a background tab's ledger blank.
 */

/** Held — the tick. Means "done" without applauding anyone for it. */
function HeldMark() {
  return <path d="M4.4 8.4 L7 11 L11.8 5.4" />;
}

/**
 * Set aside — it comes back around.
 *
 * ── WHY NOT THE TICK, AFTER ALL ───────────────────────────────────────────
 * The obvious idea — the same tick, drawn less firmly — was tried twice and
 * failed twice, and the failure is instructive enough to record so nobody
 * spends a third attempt on it.
 *
 * A tick is a ~11-unit path with one corner, rendered at 16px in a 1.25
 * stroke. Every way of making it "less certain" without changing its shape
 * runs into the same wall: dashes fine enough to leave the tick recognisable
 * are too fine to see, and dashes coarse enough to see destroy the corner —
 * and a tick without its corner is two strokes, not a tick. Lightening the
 * weight instead gives a difference of a third of a pixel. **At this size the
 * only differences that survive are differences of SILHOUETTE.**
 *
 * So the mark is a different shape, and the one shape that says what a
 * deferral actually is: a loop returning to where it began. That is the
 * product rule drawn — North stops asking now and raises it again when it
 * matters (`settledRungIds`, core/decisions/types.ts). Not a cross, not a
 * minus, not a strike-through: nothing here was lost, and nothing failed.
 *
 * It reads instantly against the tick because the two share no strokes at
 * all — which is the property that was missing.
 */
function DeferredMark() {
  return (
    <>
      {/* Three-quarters of a circle, opening at the top where the arrow
          re-enters — the gap is what stops it reading as a plain ring like
          the OPEN mark. */}
      <path d="M12.5 8.6 A4.6 4.6 0 1 1 8 4" />
      <path d="M5.9 3.2 L8 4 L7.3 6.2" />
    </>
  );
}

/** Open — a ring, still unclosed. The one thing on this screen that is live. */
function OpenMark() {
  return <circle cx="8" cy="8" r="3.4" />;
}

const MARK: Record<DecisionOutcome, () => React.ReactElement> = {
  held: HeldMark,
  deferred: DeferredMark,
  open: OpenMark,
};

const OUTCOME_LABEL: Record<DecisionOutcome, string> = {
  held: "Held",
  deferred: "Set aside for later",
  open: "Waiting on you",
};

export function OutcomeMark({ outcome }: { outcome: DecisionOutcome }) {
  const Draw = MARK[outcome];
  return (
    <span className="flex size-5 shrink-0 items-center justify-center">
      <svg
        role="img"
        aria-label={OUTCOME_LABEL[outcome]}
        viewBox="0 0 16 16"
        className={cn(
          "size-4",
          // The open one is the screen's single signal element: live state,
          // honestly marked. Everything settled is quiet ink.
          outcome === "open" ? "text-signal-coach" : "text-text-tertiary",
        )}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Draw />
      </svg>
    </span>
  );
}
