import type { Field } from "../../core/confidence.ts";
import type { SituationProfile } from "../../core/profile/types.ts";

/**
 * Seeded personas, one per interesting ladder position.
 *
 * DETERMINISM IS A REQUIREMENT, not a nicety. No `Date.now()`, no
 * `Math.random()` — every date is a fixed constant. Three payoffs: the demo is
 * reproducible, the engine is testable without freezing a clock, and
 * screenshots don't drift (docs/ARCHITECTURE.md §5).
 *
 * These exist so the product can show its range without hand-editing state.
 * They are illustrative, not real people, and the figures are chosen to make
 * each rung reachable.
 */

/** The instant every fixture was "learned". */
export const FIXTURE_ASOF = "2026-07-01T00:00:00.000Z";

/** The instant to evaluate fixtures at. Pass as `now`. */
export const FIXTURE_NOW = new Date("2026-07-27T00:00:00.000Z");

/** Most fixture answers came straight from the conversation. */
const stated = <T>(value: T): Field<T> => ({
  value,
  confidence: "stated",
  asOf: FIXTURE_ASOF,
});

/**
 * Rung 1 — liquidity floor.
 * First real salary, no buffer yet. Everything else waits.
 */
export const EARLY: SituationProfile = {
  openingConcern: stated("I want to start doing this properly."),
  financialConfidence: stated("unsure"),
  incomeBand: stated("under-100k"),
  liquidCents: stated(280_000), // $2,800
  monthlyOutCents: stated(320_000), // $3,200 → 0 months of cover
  obligations: stated([
    { kind: "student", balanceCents: 1_800_000, rateBps: 550 },
  ]),
  dependents: stated(0),
  retirementBps: stated(0),
  employerMatchBps: stated(400),
  horizonMonths: stated(480),
};

/**
 * Rung 3 — high-interest debt.
 * Buffer is there and the match is captured, but a card is charging 22%.
 */
export const SQUEEZED: SituationProfile = {
  openingConcern: stated("The card balance never seems to move."),
  financialConfidence: stated("lost"),
  incomeBand: stated("100k-200k"),
  liquidCents: stated(3_000_000), // $30,000 → 3 months
  monthlyOutCents: stated(800_000), // $8,000
  obligations: stated([
    { kind: "card", balanceCents: 1_400_000, rateBps: 2_200 },
    { kind: "auto", balanceCents: 1_900_000, rateBps: 640 },
  ]),
  dependents: stated(0),
  retirementBps: stated(500),
  employerMatchBps: stated(500),
  horizonMonths: stated(360),
};

/**
 * Rung 4 — tax-advantaged space. THE HERO SCENARIO.
 * Earns well, cash piling up in checking, no idea what to do with it
 * (docs/STRATEGY.md §6).
 */
export const UNADVISED_EARNER: SituationProfile = {
  openingConcern: stated(
    "I have cash piling up and no idea what to do with it.",
  ),
  // The demo character has a name so the letter's salutation is visible in
  // the seeded story — and consent, because this profile represents someone
  // who walked the conversation, which now closes on the terms.
  name: stated("Avery"),
  consent: { at: FIXTURE_ASOF },
  financialConfidence: stated("mostly-ok"),
  incomeBand: stated("200k-400k"),
  liquidCents: stated(14_000_000), // $140,000 → 11 months
  monthlyOutCents: stated(1_200_000), // $12,000
  obligations: stated([
    { kind: "mortgage", balanceCents: 42_000_000, rateBps: 620 },
  ]),
  dependents: stated(0),
  retirementBps: stated(400),
  employerMatchBps: stated(400),
  horizonMonths: stated(300),
};

/**
 * Every rung satisfied — the reward state.
 * Rare, and the only moment the product gets to say "you're doing well"
 * (docs/UX-ARCHITECTURE.md §7.2).
 */
export const SETTLED: SituationProfile = {
  openingConcern: stated("I think I'm fine, but I'd like to be sure."),
  financialConfidence: stated("confident"),
  incomeBand: stated("100k-200k"),
  liquidCents: stated(4_000_000), // $40,000 → 4 months
  monthlyOutCents: stated(970_000), // $9,700
  obligations: stated([]),
  dependents: stated(0),
  retirementBps: stated(2_100), // maxes the configured room exactly
  employerMatchBps: stated(500),
  horizonMonths: stated(240),
};

export const PERSONAS = {
  EARLY,
  SQUEEZED,
  UNADVISED_EARNER,
  SETTLED,
} as const;

export type PersonaId = keyof typeof PERSONAS;
