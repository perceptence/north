import {
  formatCount,
  formatCurrency,
  formatMonths,
  formatPercent,
} from "../money.ts";
import type { SituationProfile } from "../profile/types.ts";
import { derive } from "./derive.ts";
import { RUNGS } from "./rules.ts";
import type {
  Evaluation,
  EvaluateOptions,
  Read,
  ReadSegment,
  RungContext,
  RungState,
} from "./types.ts";

/**
 * Turn a situation into the one thing that matters right now.
 *
 * The entire algorithm is "find the first unsatisfied rule". No branching on
 * user type, no scoring, no weights — the ordering of `RUNGS` carries all the
 * judgment, which is what makes the engine arguable and testable.
 *
 * Pure and synchronous. `now` and `limits` are injected, so the same inputs
 * always produce the same output — the demo is reproducible and the tests need
 * no clock freezing.
 */
export function evaluate(
  profile: SituationProfile,
  options: EvaluateOptions,
): Evaluation {
  const facts = derive(profile, options);

  const context: RungContext = {
    profile,
    facts,
    limits: options.limits,
    now: options.now,
  };

  const ladder: RungState[] = RUNGS.map((rung) => ({
    id: rung.id,
    index: rung.index,
    label: rung.label,
    satisfied: rung.satisfied(context),
  }));

  // A skipped rung stays reported as unsatisfied in the ladder — it is simply
  // not the thing being asked about right now.
  const skipped = new Set(options.skip ?? []);
  const position = ladder.findIndex(
    (state) => !state.satisfied && !skipped.has(state.id),
  );

  // -1 means every rung is met: the reward state, not an empty state
  // (docs/UX-ARCHITECTURE.md §7.2).
  const current =
    position === -1
      ? null
      : { rung: ladder[position], read: RUNGS[position].read(context) };

  return { current, ladder, facts };
}

/** Formats a single figure segment for plain-text output. */
function formatSegment(segment: Extract<ReadSegment, { kind: "figure" }>): string {
  switch (segment.format) {
    case "currency":
      return formatCurrency(segment.value, { abbreviate: segment.abbreviate });
    case "percent":
      return formatPercent(segment.value);
    case "duration":
      return formatMonths(segment.value);
    case "count":
      return formatCount(segment.value);
  }
}

/**
 * Flattens a Read to a plain string.
 *
 * Not the rendering path — the UI maps segments to `Figure` components so
 * confidence survives into the accessible name. This exists for tests, logs,
 * and any non-visual consumer.
 */
export function readToPlainText(read: Read): string {
  return read.segments
    .map((segment) =>
      segment.kind === "text" ? segment.value : formatSegment(segment),
    )
    .join("");
}
