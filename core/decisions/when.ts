/**
 * When it actually happened.
 *
 * ── WHY NORTH HAS TO ASK ──────────────────────────────────────────────────
 * "I've already done this" records a fact about the PAST, but `appendDecision`
 * stamps `decidedAt` with the clock — so an action taken in March entered the
 * ledger dated today. Nothing in the engine reads `decidedAt`, which is why it
 * went unnoticed: it drives the ledger's chronology, its month grouping, and
 * the letter's "since last time" window. All three quietly lied.
 *
 * ── AND WHY IT IS FOUR TAPS, NOT A DATE PICKER ────────────────────────────
 * A calendar is a form control, and forms are refused everywhere here but
 * signup. Onboarding already shows how this product gets a precise-enough fact
 * without one — "About $2,000 / About $8,000 / About $20,000" — so the answer
 * is coarse choices in the coach's voice. Nobody remembers the date they moved
 * money anyway; they remember roughly how long ago, which is exactly the
 * precision the ledger needs.
 *
 * Each option resolves to the MIDDLE of the span it names rather than its
 * edge. "Earlier this month" meaning the 1st would be as wrong as meaning
 * today; the midpoint is the honest reading of a vague answer, and the
 * vagueness is the user's, faithfully kept.
 *
 * ── THE CLAMP THAT ISN'T THERE ────────────────────────────────────────────
 * A back-dated decision can fall before the profile field it would have
 * changed, and `catchUpDue` then stays silent — it only fires while
 * `field.asOf < settledAt`. That looks like a bug and is the correct
 * behaviour: if you acted BEFORE North last learned that figure, the figure
 * already accounts for it and there is nothing to catch up on. So there is no
 * clamp here, deliberately. The date is recorded as given and the catch-up
 * decides for itself.
 */

const DAY = 86_400_000;

export type WhenChoice = "days" | "weeks" | "months" | "longer";

export interface WhenOption {
  id: WhenChoice;
  /** The coach's words, and the only wording the screen uses. */
  label: string;
  /** Days back to the middle of the span this option names. */
  daysAgo: number;
}

/**
 * Four spans, widening.
 *
 * Three was the first draft, with "Longer ago" carrying everything past a
 * month — which put a thing done last quarter and a thing done two years ago
 * in the same bucket, and the ledger groups by month. Splitting it costs one
 * more option on a screen that is already a list of four, and buys a record
 * that is roughly right instead of roughly wrong.
 */
export const WHEN_OPTIONS: readonly WhenOption[] = [
  { id: "days", label: "In the last few days", daysAgo: 2 },
  { id: "weeks", label: "Earlier this month", daysAgo: 14 },
  { id: "months", label: "A few months ago", daysAgo: 75 },
  { id: "longer", label: "Longer ago than that", daysAgo: 240 },
];

/** The date a choice means, from a `now` the edge supplies. */
export function whenToDate(choice: WhenChoice, now: Date): Date {
  const option = WHEN_OPTIONS.find((o) => o.id === choice);
  // Unknown choice ⇒ now. Recording today is the same thing the button did
  // before this existed, which is the safe direction: it never invents a past.
  if (!option) return new Date(now.getTime());
  return new Date(now.getTime() - option.daysAgo * DAY);
}
