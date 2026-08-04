import type { Destination } from "../coach/types.ts";
import type { Decision } from "../decisions/types.ts";
import { settledRungIds } from "../decisions/types.ts";
import { explain } from "../derivation/explain.ts";
import { planGoals } from "../goals/plan.ts";
import { fig, text } from "../prose.ts";
import type { SituationProfile } from "../profile/types.ts";
import { evaluate } from "../waterfall/evaluate.ts";
import type { EvaluateOptions, ReadSegment } from "../waterfall/types.ts";
import type { LetterEntry } from "./letter.ts";

/**
 * What is behind one dispatch in the letter.
 *
 * ── WHY A LETTER ENTRY NEEDED A BACK ──────────────────────────────────────
 * Insights told you a thing moved and what that means, and then stopped. Every
 * one of those sentences is the visible tip of a real calculation — the buffer
 * entry sits on `explain("liquidityMonths")`, the ladder entry on a full
 * `evaluate()`, the record entry on the actual ledger — and none of it was
 * reachable. A reader who wanted to know *how you know that* had nowhere to
 * go, which is the one thing no figure in North is allowed to be: something
 * taken on faith (docs/DESIGN-SYSTEM.md §8.4, on the interrogable rung mark).
 *
 * ── IT IS COMPOSED, NEVER STORED ──────────────────────────────────────────
 * Everything here is derived at read time from the same profile, ladder and
 * ledger the letter itself was composed from. There is no second copy of the
 * reasoning that could drift from the first — the buffer's working is
 * literally `explain()`'s, and the ladder's position is literally
 * `evaluate()`'s.
 *
 * ── AND IT ONLY SAYS WHAT IT CAN ──────────────────────────────────────────
 * `null` where there is nothing honest to add. A `record` entry with an empty
 * ledger has no detail behind it, and a room that opens onto "there is nothing
 * here" is worse than a sentence that never offered to open.
 */

export interface BehindSection {
  /** Mono-caps heading — a label, never a sentence. */
  heading: string;
  segments: ReadSegment[];
}

export interface Behind {
  /** The eyebrow: what kind of change is being opened. */
  eyebrow: string;
  /** The one sentence the room exists for, in the coach's voice. */
  thesis: string;
  sections: BehindSection[];
  /**
   * Where to act on it. A NAME, not a URL — `core/` does not know this app's
   * routes (the same rule `CoachDoor` follows).
   */
  goes?: Destination;
  /** In the coach's voice, naming what is through it. */
  goesLabel?: string;
}

/** Flattens a derivation's working into one readable run of prose. */
function working(steps: { segments: ReadSegment[] }[]): ReadSegment[] {
  return steps.flatMap((step, index) =>
    index === 0 ? step.segments : [text(" "), ...step.segments],
  );
}

export function behind(
  entry: LetterEntry,
  previous: SituationProfile | null,
  current: SituationProfile,
  decisions: Decision[],
  options: EvaluateOptions,
): Behind | null {
  const evaluation = evaluate(current, {
    ...options,
    skip: settledRungIds(decisions, options.now),
  });
  const facts = evaluation.facts;

  switch (entry.kind) {
    /* ── THE BUFFER ───────────────────────────────────────────────────────
       Its own arithmetic, straight from `explain()` — the same working the
       derivation overlay shows when you tap the figure on Today. */
    case "buffer": {
      const months = explain("liquidityMonths", current, facts, options);
      const sections: BehindSection[] = [
        { heading: "The working", segments: working(months.steps) },
        { heading: "Which gives", segments: months.result },
      ];

      // What actually moved it — only where there is a previous state to
      // compare against. Without one this is a first reading, not a change.
      if (previous) {
        sections.push({
          heading: "What moved",
          segments: [
            text("You held "),
            fig(
              previous.liquidCents.value,
              "currency",
              previous.liquidCents.confidence,
              { label: "in cash before" },
            ),
            text(" in cash when North last looked, and "),
            fig(
              current.liquidCents.value,
              "currency",
              current.liquidCents.confidence,
              { label: "in cash now" },
            ),
            text(" now."),
          ],
        });
      }

      return {
        eyebrow: "Behind the buffer",
        thesis: "How many months your cash actually covers, and how it got there.",
        sections,
        goes: "today",
        goesLabel: "See it on Today",
      };
    }

    /* ── THE LADDER ───────────────────────────────────────────────────────
       Position is only meaningful next to what is on either side of it, so
       the room names the rung, what clears it, and what waits behind. */
    case "ladder": {
      const current_ = evaluation.current;
      const cleared = evaluation.ladder.filter((r) => r.satisfied).length;

      const sections: BehindSection[] = [
        {
          heading: "Where you are",
          segments: [
            text("You have cleared "),
            fig(cleared, "count", "inferred", { label: "rungs" }),
            text(" of "),
            fig(evaluation.ladder.length, "count", "stated", {
              label: "in total",
            }),
            text(
              current_
                ? `, and the one in front of you is ${current_.rung.label}.`
                : ", and there is nothing in front of you.",
            ),
          ],
        },
      ];

      if (current_) {
        sections.push({
          heading: "Why this one",
          segments: current_.read.segments,
        });
        sections.push({
          heading: "What clears it",
          segments: [text(`${current_.read.action.commit}.`)],
        });

        const next = evaluation.ladder.find(
          (rung) => rung.index > current_.rung.index && !rung.satisfied,
        );
        if (next) {
          sections.push({
            heading: "And then",
            segments: [
              text(`Clear it and ${next.label} is what I’d ask about next.`),
            ],
          });
        }
      }

      return {
        eyebrow: "Behind the ladder",
        thesis: "The order everything is in, and why this rung comes first.",
        sections,
        goes: "today",
        goesLabel: "See where you stand on Today",
      };
    }

    /* ── THE RECORD ───────────────────────────────────────────────────────
       Genuine time-series data — the one thing on this screen that is not
       derived from a single snapshot. Nothing here counts failures. */
    case "record": {
      if (decisions.length === 0) return null;

      const held = decisions.filter((d) => d.outcome === "held").length;
      const open = decisions.filter((d) => d.outcome === "open").length;
      const latest = decisions.reduce((newest, d) =>
        d.decidedAt > newest.decidedAt ? d : newest,
      );

      const sections: BehindSection[] = [
        {
          heading: "What is in it",
          segments: [
            text("You have made "),
            fig(decisions.length, "count", "stated", { label: "decisions" }),
            text(decisions.length === 1 ? " decision and held " : " decisions and held "),
            fig(held, "count", "stated", { label: "held" }),
            text(
              open > 0
                ? ". Anything still open is a later date, not a miss."
                : ". Anything you put off is a later date, not a miss.",
            ),
          ],
        },
        {
          heading: "The most recent",
          segments: [text(`“${latest.summary}.”`)],
        },
      ];

      return {
        eyebrow: "Behind the record",
        thesis: "What you have actually decided, and what came of it.",
        sections,
        goes: "decisions",
        goesLabel: "Open your record",
      };
    }

    /* ── A GOAL ───────────────────────────────────────────────────────────
       Pacing, from the same planner Goals renders — target, what is there,
       and what it asks of a month. */
    case "goal": {
      const plan = planGoals(current, facts.monthlySurplus.value);
      const primary = plan.primary;
      if (!primary) return null;

      return {
        eyebrow: "Behind the goal",
        thesis: `What ${primary.goal.label.toLowerCase()} actually asks of you.`,
        sections: [
          {
            heading: "The pacing",
            segments: [
              text("It asks about "),
              fig(primary.monthlyNeedCents, "currency", primary.confidence, {
                label: "a month",
              }),
              text(" a month, against "),
              fig(
                facts.monthlySurplus.value,
                "currency",
                facts.monthlySurplus.confidence,
                { label: "spare each month" },
              ),
              text(" spare."),
            ],
          },
        ],
        goes: "goals",
        goesLabel: "See it on Goals",
      };
    }
  }
}
