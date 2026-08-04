import type { Cents } from "../money.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { DerivedFacts, RungId } from "./types.ts";

/**
 * What another month of not doing this costs.
 *
 * ── WHY THIS IS NOT PART OF THE READ ──────────────────────────────────────
 * The read names the gap and frames the tradeoff, and that is the judgment —
 * free, always, per docs/MEMBERSHIP.md. This is a different thing: a
 * supplementary figure that prices the delay. It belongs BESIDE the decision,
 * never inside the sentence, and the tier sheet lists it so the paywall
 * cannot misrepresent what Plus buys.
 *
 * ── AND WHY IT IS NOT A GUILT METER ───────────────────────────────────────
 * "Not now" is a first-class action here (docs/UX-ARCHITECTURE.md), and the
 * decisions model has no failure state by construction — there is no
 * `"missed"` to record. A cost of delay could easily become the scold this
 * product refuses everywhere else, so the rule is: it states arithmetic, it
 * never counts up, and it never accumulates a running total of what you did
 * not do. One figure, one month, stated once.
 *
 * ── MOST RUNGS HONESTLY HAVE NO ANSWER ────────────────────────────────────
 * Only two costs are arithmetic rather than opinion:
 *
 *   match                — unclaimed employer money is a rate you can compute.
 *   high-interest-debt   — interest accrues at a rate you already told us.
 *
 * The rest return `null`, deliberately:
 *
 *   liquidity     — holding cash "costs" a return nobody is owed. Pricing it
 *                   would mean assuming a market return, which is the advice
 *                   line (docs/FOUNDATION.md §9).
 *   tax-advantaged— the loss is a DEADLINE, not a monthly rate, and the read
 *                   already says how many days are left.
 *   goal          — the cost is a date slipping, not money.
 *   taxable,
 *   optimization  — any figure here would be a guess wearing a decimal point.
 *
 * `null` is the honest return, and callers render nothing rather than a zero.
 */
/**
 * To the nearest dollar.
 *
 * This figure is introduced by the word "about", and "about $733.33" is a
 * sentence arguing with itself — a hedge with two decimal places is exactly
 * the false precision the product refuses (CLAUDE.md: ranges, never
 * `$1,247,832`). Rounded HERE rather than at the edge because the roundness
 * is part of the claim, not part of the rendering: the honest figure is a
 * rough monthly rate, and a component that formatted the cents away would be
 * hiding precision the engine had asserted.
 */
const toWholeDollars = (cents: number): Cents => Math.round(cents / 100) * 100;

export function monthlyCostOfDelay(
  rungId: RungId,
  profile: SituationProfile,
  facts: DerivedFacts,
): Cents | null {
  if (rungId === "match") {
    const missedBps =
      profile.employerMatchBps.value - profile.retirementBps.value;
    if (missedBps <= 0) return null;
    // Annual unclaimed match ÷ 12, computed in one step so the division
    // rounds once rather than twice.
    const monthly = toWholeDollars(
      (facts.monthlyIncome.value * missedBps) / 10_000,
    );
    return monthly > 0 ? monthly : null;
  }

  if (rungId === "high-interest-debt") {
    const worst = facts.costliestObligation.value;
    if (!worst || worst.balanceCents <= 0 || worst.rateBps <= 0) return null;
    const monthly = toWholeDollars(
      (worst.balanceCents * worst.rateBps) / 10_000 / 12,
    );
    return monthly > 0 ? monthly : null;
  }

  return null;
}
