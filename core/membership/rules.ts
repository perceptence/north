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
 * The tiers, line by line, as a COMPARISON.
 *
 * ── WHY BOTH COLUMNS, ALWAYS ──────────────────────────────────────────────
 * A paywall that lists only what you are missing is an advertisement. It
 * also misrepresents this product specifically: the free tier is a complete
 * coach, and someone deciding whether to pay deserves to see that written
 * down next to what they would be adding. So every line names what BOTH
 * tiers give, and a free reader can see that most of the rows already say
 * yes.
 *
 * `free: true` means the free tier has it in full. Where the tiers differ,
 * `free` carries the honest description of the smaller version rather than a
 * dash — "The first one, fully paced" is a real answer; an empty cell is a
 * shrug.
 */
export interface TierLine {
  what: string;
  free: string | true;
  plus: string | true;
}

export const TIER_LINES: readonly TierLine[] = [
  { what: "The daily read, and the decision behind it", free: true, plus: true },
  { what: "Your record — decisions, callbacks, the letter", free: true, plus: true },
  { what: "Showing the working behind every figure", free: true, plus: true },
  { what: "Asking anything, in writing", free: true, plus: true },
  { what: "Correcting what North knows, any time", free: true, plus: true },
  /**
   * The other half of that loop, and free for the same reason: a coach
   * working from a figure it has never re-checked is giving worse judgment,
   * not less of it. Gating freshness would gate accuracy.
   */
  { what: "North re-asking when a figure goes stale", free: true, plus: true },
  {
    what: "What-ifs you can drag",
    free: "Debt and contributions",
    plus: "All five, including home, career break and pay cut",
  },
  {
    what: "Goals",
    free: "The first one, fully paced",
    plus: "Every goal, funded in deadline order",
  },
  { what: "Talking to North out loud", free: "—", plus: "The whole conversation" },
  { what: "The story of how you got here", free: "—", plus: "Replayed, beat by beat" },
  /**
   * Listed here because it is gated, and gating anything unlisted is how a
   * paywall starts lying. It sits deliberately close to the line NEVER_GATED
   * draws: the read still names the gap and the action, free — this prices
   * the WAIT, which is neither the one thing that matters nor what to do
   * about it. If that ever stops being true, this line moves to `free: true`
   * rather than the sentence being softened.
   */
  {
    what: "What waiting costs",
    free: "—",
    plus: "What another month of not acting adds up to",
  },
];

/**
 * What Plus adds, for anywhere that needs the short version. Derived from
 * the table above rather than written twice, so the two cannot drift.
 */
export const PLUS_INCLUDES: readonly string[] = TIER_LINES.filter(
  (line) => line.free !== true,
).map((line) => (typeof line.plus === "string" ? line.plus : line.what));

/**
 * The sentence that keeps the paywall honest, shown wherever Plus is
 * proposed. It is product copy AND policy: the test suite asserts the free
 * set still contains what this sentence promises.
 */
export const NEVER_GATED =
  "What Plus never buys: the read. North tells you the one thing that " +
  "matters — and what to do about it — free, always.";
