/**
 * Membership — the free/plus line, as data.
 *
 * The reasoning core never imports this (guarded by test): gates live at
 * the surface, the engine answers everyone identically.
 */

export { FREE } from "./types.ts";
export type { Membership, Tier } from "./types.ts";
export {
  FREE_SCENARIOS,
  NEVER_GATED,
  PLUS_INCLUDES,
  PLUS_PRICE_CENTS,
  TIER_LINES,
  canOpenScenario,
  goalLimit,
  scenarioTier,
  storyIncluded,
  voiceIncluded,
} from "./rules.ts";
export type { TierLine } from "./rules.ts";
