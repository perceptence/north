import { fig, text } from "../prose.ts";
import type { ReadSegment } from "../waterfall/types.ts";
import type { Decision } from "./types.ts";

/**
 * What the ledger says about you, in the coach's voice.
 *
 * ── WHY THIS IS PROSE AND NOT A SCORE ─────────────────────────────────────
 * Decisions exists to produce pride rather than guilt (docs/STRATEGY.md §3,
 * P3) — and the obvious way to do that is the wrong way. A streak counter, a
 * badge, a percentage held: every one of them is a scoreboard, and a scoreboard
 * cuts BOTH ways. The moment a run of five is something to celebrate, breaking
 * it is a failure, and the screen has manufactured the exact emotion it exists
 * to avoid — just deferred to the first miss.
 *
 * So the pride is not performed, it is STATED. The coach reads your record back
 * to you in the same voice that asked for it, and the sentence is worth reading
 * because it is true, not because it is loud.
 *
 * ── DEFERRALS ARE NEVER A DEFICIT ─────────────────────────────────────────
 * "Two of three" implies a third that got away. A deferred decision is a
 * decision — you considered it and said not now, which is the product working.
 * So held and set-aside are counted as two kinds of thing, never as a hit rate.
 */

export interface LedgerSummary {
  /** The coach's read on the whole record. */
  read: ReadSegment[];
  /** Nothing has been decided yet — the caller shows an empty state instead. */
  empty: boolean;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function summariseLedger(decisions: Decision[]): LedgerSummary {
  if (decisions.length === 0) {
    return { read: [], empty: true };
  }

  const held = decisions.filter((d) => d.outcome === "held").length;
  const deferred = decisions.filter((d) => d.outcome === "deferred").length;
  const open = decisions.filter((d) => d.outcome === "open").length;

  const count = (n: number) => fig(n, "count", "stated");

  // Nothing settled yet — the record has started, and that is the whole news.
  if (held === 0 && deferred === 0) {
    return {
      read: [
        text("You have started a record. "),
        count(open),
        text(
          ` ${plural(open, "decision is", "decisions are")} waiting on you.`,
        ),
      ],
      empty: false,
    };
  }

  const segments: ReadSegment[] = [];

  if (held > 0 && deferred === 0) {
    // The strongest thing that can honestly be said, said plainly.
    segments.push(
      text("You have held every decision you have made with North — "),
      count(held),
      text(` ${plural(held, "of them", "of them")} so far.`),
    );
  } else if (held > 0) {
    segments.push(
      text("You have held "),
      count(held),
      text(` ${plural(held, "decision", "decisions")}, and set `),
      count(deferred),
      text(` aside for later.`),
    );
  } else {
    // Only deferrals. This is not a failure state and must not read as one.
    segments.push(
      text("You have looked at "),
      count(deferred),
      text(
        ` ${plural(deferred, "decision", "decisions")} and set ${plural(deferred, "it", "them")} aside for later. Nothing is overdue — North will raise ${plural(deferred, "it", "them")} again when it matters.`,
      ),
    );
  }

  if (open > 0) {
    segments.push(
      text(" "),
      count(open),
      text(` more ${plural(open, "is", "are")} waiting on you.`),
    );
  }

  return { read: segments, empty: false };
}
