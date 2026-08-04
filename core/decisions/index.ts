/**
 * Decisions — what you committed to, and what became of it.
 *
 * The outcome vocabulary is deliberately three words wide and has no failure
 * state; see `types.ts` for why that is enforced by the type system rather
 * than by a style guide.
 */

export { openDecision, settledRungIds } from "./types.ts";
export type { Decision, DecisionOutcome } from "./types.ts";
export {
  CALLBACK_AFTER_DAYS,
  callbackDue,
  callbackDueAt,
  committedOn,
} from "./callback.ts";
export { catchUpDue } from "./catch-up.ts";
export { WHEN_OPTIONS, whenToDate } from "./when.ts";
export type { WhenChoice, WhenOption } from "./when.ts";
export { profileWhen, recollect } from "./recollection.ts";
export { ledgerMonths } from "./timeline.ts";
export type { LedgerMonth } from "./timeline.ts";
export { summariseLedger } from "./summary.ts";
export type { LedgerSummary } from "./summary.ts";
