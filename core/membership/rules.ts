import type { ScenarioId } from "../navigator/types.ts";
import type { Cents } from "../money.ts";
import type { Tier } from "./types.ts";

/**
 * What each tier holds — as data, like the Waterfall's rules.
 *
 * Every gate in the product reads from here, so the split can be argued
 * about, tested, and changed in one place. A component deciding for itself
 * what is free would be a second copy of this policy, and second copies rot.
 */

/** $4.99 a month. Integer cents, like every other amount in the product. */
export const PLUS_PRICE_CENTS: Cents = 499;

/**
 * The scenarios the free tier keeps, and why they are these two:
 *
 *   · `debt-first` — THE ETHICS PIN. The scenario that tells you to stop
 *     losing money is never sold back to you. If a widening of Plus ever
 *     costs this line, the product has started charging for the warning,
 *     and the test on it must fail loudly.
 *   · `contribute-more` — the generic "what if I put more away", so the
 *     free tier demonstrates what a scenario IS rather than gating the
 *     whole idea of one.
 *
 * The rest — home, career break, pay cut — are elective explorations:
 * valuable, deep, and honestly gateable because nothing urgent hides
 * behind them.
 */
export const FREE_SCENARIOS: ReadonlySet<ScenarioId> = new Set<ScenarioId>([
  "debt-first",
  "contribute-more",
]);

export function scenarioTier(id: ScenarioId): Tier {
  return FREE_SCENARIOS.has(id) ? "free" : "plus";
}

export function canOpenScenario(tier: Tier, id: ScenarioId): boolean {
  return tier === "plus" || FREE_SCENARIOS.has(id);
}

/**
 * How many goals a tier can carry.
 *
 * The FIRST goal is free — pacing included — because "what am I working
 * toward" is part of the read, and a coach who won't discuss your one goal
 * isn't coaching. Carrying several competing goals, allocated in deadline
 * order, is the deeper planning Plus pays for.
 */
export function goalLimit(tier: Tier): number {
  return tier === "plus" ? Number.POSITIVE_INFINITY : 1;
}

/**
 * The spoken conversation. The typed coach — same router, same engine, same
 * answers — stays free, so nothing sayable is unreachable on free; Plus buys
 * the modality, not the knowledge.
 */
export function voiceIncluded(tier: Tier): boolean {
  return tier === "plus";
}

/** The story replay — the same letter material, staged. */
export function storyIncluded(tier: Tier): boolean {
  return tier === "plus";
}

/**
 * What Plus holds, for anywhere that lists it. Copy in the coach's voice,
 * written once — the sheet and any future surface quote this rather than
 * paraphrasing it apart.
 */
export const PLUS_INCLUDES: readonly string[] = [
  "Every what-if — home, career break, pay cut",
  "Voice — the whole conversation, out loud",
  "Every goal you’re carrying, not just the first",
  "The story of how you got here, replayed",
];

/**
 * The sentence that keeps the paywall honest, shown wherever Plus is
 * proposed. It is product copy AND policy: the test suite asserts the free
 * set still contains what this sentence promises.
 */
export const NEVER_GATED =
  "What Plus never buys: the read. North tells you the one thing that " +
  "matters — and what to do about it — free, always.";
