import type { Decision } from "./types.ts";

/**
 * When North is allowed to ask whether a commitment actually happened.
 *
 * ── WHY A COMMITMENT HAS TO RIPEN ─────────────────────────────────────────
 * Today used to call back on ANY open decision, which meant pressing the ink
 * button replaced the read with *"You said you'd do that. Did that happen?"*
 * one second later. A coach that asks whether you did the thing immediately
 * after you said you would is not attentive — it is nagging, and it makes the
 * commit read as "nothing happened except the screen changed".
 *
 * Real commitments take days. Moving money between accounts, changing a
 * contribution rate, opening something — none of it is instant, and North has
 * no way to observe any of it (it sees no accounts). So it waits, and the
 * waiting is the respect.
 *
 * Three days: long enough that the answer can honestly be yes, short enough
 * that the coach still reads as paying attention. The ledger shows the
 * commitment as `open` the whole time — the record is immediate, only the
 * QUESTION is deferred.
 */
export const CALLBACK_AFTER_DAYS = 3;

const DAY = 86_400_000;

/**
 * The one commitment North may ask about now, if any.
 *
 * Distinct from `openDecision`, deliberately. That one answers "what is
 * unresolved" — which is what a LEDGER shows. This answers "what may I ask
 * about", which is what a coach does. Conflating them is what produced the
 * instant callback.
 */
export function callbackDue(decisions: Decision[], now: Date): Decision | null {
  const cutoff = now.getTime() - CALLBACK_AFTER_DAYS * DAY;
  return (
    decisions.find(
      (d) =>
        d.outcome === "open" && new Date(d.decidedAt).getTime() <= cutoff,
    ) ?? null
  );
}
