/**
 * The account — identity, and how it moves between devices.
 *
 * Separate from `SituationProfile` on purpose: the profile is a situation
 * the engine reasons over, this is who it belongs to. See ./types.ts.
 */

export { initials, looksLikeEmail, passwordProblem, PASSWORD_MIN } from "./types.ts";
export type { Account, AccountSecret } from "./types.ts";
export {
  BUNDLE_VERSION,
  checksum,
  decodeBundle,
  encodeBundle,
  formatCode,
  makeAccountKey,
} from "./recovery.ts";
export type { RecoveryBundle } from "./recovery.ts";
