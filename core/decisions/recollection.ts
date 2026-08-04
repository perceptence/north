import { fig, text } from "../prose.ts";
import type { SituationProfile } from "../profile/types.ts";
import { derive } from "../waterfall/derive.ts";
import type { EvaluateOptions, ReadSegment, RungId } from "../waterfall/types.ts";
import type { Decision } from "./types.ts";

/**
 * "Last time we spoke you were holding 11 months of cash."
 *
 * ── THE SECOND SENTENCE OF THE MOAT ───────────────────────────────────────
 * docs/STRATEGY.md §5 Stage 5 specifies the return as TWO sentences, and only
 * the first was built:
 *
 *     You said you'd open the IRA. Did that happen?
 *     Last time we spoke you were holding 11 months of cash. Let's see where
 *     you landed.
 *
 * The first sentence proves North kept a record. On its own that is a log,
 * and a competitor's notification could produce it — it needs nothing but the
 * string you typed. The SECOND is the one that proves memory, because it
 * describes the situation as it stood at the time rather than as it stands
 * now, and nothing but a coach that kept your history can say it.
 *
 * ── WHY IT IS DERIVED, NOT STORED ─────────────────────────────────────────
 * The recollection is computed by running the ENGINE over the profile as it
 * was when the decision was made. Nothing is written down at commit time and
 * read back later, which matters for two reasons: a stored sentence would be
 * a second source of financial claims that could drift from the rules, and
 * a decision made before a rule changed would keep quoting the old rule
 * forever. Every figure here comes from `derive`, the same function Today
 * uses, so a recollection cannot contradict the read above it.
 *
 * ── ONE FACT, CHOSEN BY THE RUNG ──────────────────────────────────────────
 * Not "here is a summary". The recollection names the thing that rung was
 * ABOUT, so it reads as remembering the conversation rather than reciting a
 * balance sheet. That mapping is the same shape as `FIELD_BEHIND_RUNG` in
 * `core/onboarding/correction.ts`, and for the same reason: what a rung
 * concerns is a property of the rung, not of the screen.
 *
 * Returns `null` when the profile of the day carries nothing worth recalling
 * — a recollection that has to reach is worse than none, and the caller then
 * simply asks its question.
 */

/** The one figure worth recalling, per rung. */
type Recalled = { segments: ReadSegment[] } | null;

export function recollect(
  decision: Decision,
  then: SituationProfile,
  options: EvaluateOptions,
): ReadSegment[] | null {
  const facts = derive(then, options);
  const recalled = byRung(decision.rungId, facts);
  if (!recalled) return null;

  return [
    text("Last time we spoke you were "),
    ...recalled.segments,
    // The invitation, not a second question — the question is the sentence
    // above this one, and two questions in a row is an interrogation.
    text(". Let’s see where you landed."),
  ];
}

function byRung(
  rungId: RungId,
  facts: ReturnType<typeof derive>,
): Recalled {
  switch (rungId) {
    case "liquidity":
      return {
        segments: [
          text("holding "),
          fig(facts.liquidityMonths.value, "duration", facts.liquidityMonths.confidence, {
            label: "of cover",
          }),
          text(" of cover"),
        ],
      };

    case "high-interest-debt": {
      const worst = facts.costliestObligation.value;
      if (!worst) return null;
      return {
        segments: [
          text("carrying "),
          fig(worst.balanceCents, "currency", facts.costliestObligation.confidence, {
            label: "of expensive debt",
          }),
          text(" at "),
          fig(worst.rateBps, "percent", facts.costliestObligation.confidence, {
            label: "interest",
          }),
        ],
      };
    }

    case "match":
    case "tax-advantaged": {
      if (facts.unusedTaxAdvantaged.value <= 0) return null;
      return {
        segments: [
          text("leaving "),
          fig(
            facts.unusedTaxAdvantaged.value,
            "currency",
            facts.unusedTaxAdvantaged.confidence,
            { label: "of tax-advantaged room unused" },
          ),
          text(" of tax-advantaged room unused"),
        ],
      };
    }

    case "goal":
    case "taxable":
    case "optimization": {
      // These rungs are all about what the surplus does, so the surplus is
      // what was being talked about. A negative one is not a recollection
      // worth opening with.
      if (facts.monthlySurplus.value <= 0) return null;
      return {
        segments: [
          text("putting "),
          fig(facts.monthlySurplus.value, "currency", facts.monthlySurplus.confidence, {
            label: "a month aside",
          }),
          text(" a month aside"),
        ],
      };
    }
  }
}

/**
 * The profile as it stood when a decision was made.
 *
 * Snapshots record when a state was SUPERSEDED, so the profile in force at
 * some moment is the first one superseded at or after it. Falls back to the
 * current profile, which is correct rather than a fudge: nothing has been
 * superseded since, so the state of that day is still the state of today.
 *
 * Generic over `{ at, profile }` for the same reason `pickBaseline` is —
 * `core/` may not see the store's snapshot type, and structural typing means
 * it does not need to.
 */
export function profileWhen<T extends { at: string; profile: SituationProfile }>(
  history: readonly T[],
  moment: string,
  current: SituationProfile,
): SituationProfile {
  const at = new Date(moment).getTime();
  for (const snapshot of history) {
    if (new Date(snapshot.at).getTime() >= at) return snapshot.profile;
  }
  return current;
}
