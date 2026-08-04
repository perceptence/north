/**
 * Which past state the letter should measure against.
 *
 * ── WHY "THE PREVIOUS ONE" IS THE WRONG ANSWER ────────────────────────────
 * The store keeps thirty snapshots and appends one on every `saveProfile`, so
 * the most recent is whatever the profile looked like immediately before the
 * last edit — often seconds ago. Reading that as "last time we looked" meant
 * the letter diffed a keystroke.
 *
 * The cost landed on the smartest interaction the product has. Correcting one
 * number — the loop docs/UX-ARCHITECTURE.md says "proves the system thinks
 * rather than displays" — turned Insights from *"5 WEEKS · JUN 27 – AUG 3 /
 * Four things moved since we last looked"* into *"1 DAYS · AUG 3 – AUG 3 /
 * Nothing changed. That's fine"*, and hid the only in-product link to the
 * story. One tap erased five weeks. The reviewer was punished for engaging.
 *
 * A letter is a report on a STRETCH. So the baseline is the most recent state
 * that is genuinely old enough to have been lived through, and only when
 * there is none does it fall back to the oldest thing on file — because the
 * honest alternative to "a few weeks ago" is "since we started", never "since
 * two seconds ago".
 *
 * Generic over `{ at }` rather than importing the store's snapshot type:
 * `core/` may not reach into `state/`, and structural typing means it does
 * not need to.
 */

/**
 * Below this, two states are the same moment as far as a reader is concerned.
 *
 * Three days rather than one: a person who corrects two numbers on Tuesday and
 * opens Insights on Wednesday should still be reading about their month, not
 * about Tuesday.
 */
export const BASELINE_MIN_DAYS = 3;

const DAY = 86_400_000;

export function pickBaseline<T extends { at: string }>(
  history: readonly T[],
  now: Date,
  minDays: number = BASELINE_MIN_DAYS,
): T | null {
  if (history.length === 0) return null;

  const cutoff = now.getTime() - minDays * DAY;
  // Newest first, so the first match is the most recent state old enough to
  // be worth reporting on.
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (new Date(history[i].at).getTime() <= cutoff) return history[i];
  }

  // Everything on file is recent — every snapshot was written in the last few
  // days. The oldest is then the only honest baseline available, and it is
  // still a truer answer than "the state before the last keystroke".
  return history[0];
}
