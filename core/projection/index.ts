/**
 * Where this path leads.
 *
 * Pure TypeScript. Feeds `HorizonBand`, whose width is the uncertainty.
 * See docs/WATERFALL.md §7 for what this deliberately does not model.
 */

export {
  project,
  futureValue,
  roundForDisplay,
  spreadMultiplier,
  RETURN_RANGE,
  SPREAD,
} from "./horizon.ts";
export type {
  Projection,
  ProjectionAssumption,
  ReturnRange,
} from "./types.ts";
