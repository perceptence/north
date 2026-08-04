/**
 * Membership — two tiers, and the line between them.
 *
 * ── THE PRINCIPLE THAT DECIDES EVERY GATE ─────────────────────────────────
 * The coach's JUDGMENT is never paywalled; its TIME is. North always tells
 * you the one thing that matters and what to do about it — the read, the
 * decision loop, the letter — because a financial coach that hides "your
 * debt is costing you more than investing returns" behind $4.99 is not a
 * coach, and the register this product lives in does not survive it.
 *
 * What Plus buys is room to think: more what-ifs, the spoken conversation,
 * every goal instead of the first, the story replayed.
 *
 * ── AND WHERE THE ENGINE STANDS ───────────────────────────────────────────
 * Nothing in `waterfall/`, `insights/`, `decisions/` or `coach/` knows tiers
 * exist. `evaluate()` has no tier parameter; the letter composes identically
 * for everyone. Gating happens at the SURFACE, from the rules in this module
 * — which is what makes the promise above structural rather than editorial,
 * and it is guarded by test (see rules.test.ts, "the engine has never heard
 * of money").
 */

export type Tier = "free" | "plus";

export interface Membership {
  tier: Tier;
  /** ISO — when Plus began. Absent on free. */
  since?: string;
  /** ISO — when the period renews (or, if ending, runs out). */
  renewsAt?: string;
  /**
   * Cancelled, running to period end. Two tiers make downgrade and cancel
   * the same act — and it is an act, not a negotiation: one tap, no
   * retention flow, everything stays until the period ends.
   */
  endsAtPeriodEnd?: boolean;
}

export const FREE: Membership = { tier: "free" };
