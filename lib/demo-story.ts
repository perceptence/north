"use client";

import type { Decision } from "@/core/decisions/types";
import type { SituationProfile } from "@/core/profile/types";
import { seedDecisions } from "@/state/decisions-store";
import { seedProfile } from "@/state/profile-store";

/**
 * The demo story, as a function rather than a page.
 *
 * Not random impressive numbers: a NARRATIVE, staged so every surface sings at
 * once. Five weeks ago this person held four months of cash and contributed
 * under the match. Since then they built the buffer, raised the contribution,
 * held both decisions, and named two goals that compete for one surplus.
 *
 * Dates are computed at call time, so the demo is evergreen — "two weeks ago"
 * stays two weeks ago. Clock use is fine HERE: this is the edge, not core.
 *
 * It lives outside the /demo route so ARRIVAL can seed directly and navigate
 * straight to Today. Routing through the interstitial would drop the
 * travelling wordmark for a frame, which is exactly the seam the transition
 * exists to hide.
 */

const DAY = 86_400_000;

export function seedDemoStory(): void {
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();

  const at = <T,>(value: T, daysAgo: number, confidence = "stated") => ({
    value,
    confidence,
    asOf: iso(daysAgo),
  });

  /** The situation as it stood five weeks ago — the letter diffs against this. */
  const before = {
    openingConcern: at("I have cash piling up and no idea what to do with it.", 37),
    financialConfidence: at("mostly-ok", 37),
    incomeBand: at("200k-400k", 37),
    liquidCents: at(5_000_000, 37), // $50k → 4 months
    monthlyOutCents: at(1_200_000, 37),
    // A mortgage well under the 700bps high-interest line, plus a card that
    // is well over it. The card is what makes rung 3 a real question North
    // asked and the demo answered — see the deferred decision below. Neither
    // touches the headline numbers: obligations feed the DEBT rung only, not
    // surplus or excess cash (core/waterfall/derive.ts).
    obligations: at(
      [
        { kind: "mortgage", balanceCents: 42_000_000, rateBps: 620 },
        { kind: "card", balanceCents: 340_000, rateBps: 1890 },
      ],
      37,
    ),
    dependents: at(0, 37),
    retirementBps: at(200, 37), // under the 4% match
    employerMatchBps: at(400, 37),
    horizonMonths: at(300, 37),
  };

  /** Today: buffer built, match cleared, goal named — rung 4 is the story. */
  const current = {
    ...before,
    liquidCents: at(14_000_000, 2), // $140k → 11 months
    retirementBps: at(400, 15), // raised to the match
    goals: [
      at(
        {
          label: "A home deposit",
          targetCents: 8_000_000,
          withinMonths: 36,
          savedCents: 1_500_000,
        },
        6,
      ),
      // A second goal, nearer and smaller — so the demo shows the surplus
      // being ALLOCATED rather than one goal claiming all of it.
      at(
        {
          label: "A sabbatical",
          targetCents: 3_000_000,
          withinMonths: 18,
          savedCents: 400_000,
        },
        3,
      ),
    ],
  };

  // Seeded THROUGH the stores, never by writing localStorage directly. Both
  // stores cache in module scope, so a screen that has already read them (the
  // Arrival door calls useProfile to choose "Begin" vs "Continue") has marked
  // that cache loaded — and a behind-the-back write would never be read. That
  // is precisely how /demo used to land the visitor in onboarding.
  seedProfile(current as unknown as SituationProfile, [
    { at: iso(37), profile: before as unknown as SituationProfile },
  ]);

  /**
   * Nine months of record, so the timeline has something to be a timeline
   * ABOUT. Two months carry two decisions each (the clusters), one month
   * carries none (the gap), and the run reaches back far enough that the
   * rail shows a year's rhythm rather than a fortnight's.
   *
   * Every entry has to be true to the engine, not just to the screen:
   *
   *   open      tax-advantaged, 2 days ago. NOT in `settledRungIds`, so the
   *             rung stays current and Home keeps its read — and it is inside
   *             the 3-day callback window, so North has not asked yet. That
   *             is the honest moment: recorded, not yet chased.
   *
   *   deferred  high-interest debt and, earlier, the match. Deferrals ARE in
   *             `settledRungIds`, which is the point: waving one off means
   *             North stops asking and moves down the ladder, which is why
   *             Home sits on rung 4 rather than rung 3.
   *
   *   held      the buffer built in stages, then the match raised.
   *
   * EVERY rung used here is one the ladder has already settled (liquidity,
   * match, high-interest-debt) or the current one held open. Filing a HELD
   * decision against an unsettled rung would skip it, and Home would jump
   * past the read this whole demo is built around.
   */
  seedDecisions(([
    {
      id: "demo-space",
      rungId: "tax-advantaged",
      summary: "Move the excess into tax-advantaged space",
      outcome: "open",
      decidedAt: iso(2),
      amountCents: 10_400_000,
    },
    {
      id: "demo-card",
      rungId: "high-interest-debt",
      summary: "Clear the expensive debt first",
      outcome: "deferred",
      decidedAt: iso(11),
      resolvedAt: iso(11),
      amountCents: 340_000,
    },
    {
      id: "demo-match",
      rungId: "match",
      summary: "Raise it to the match",
      outcome: "held",
      decidedAt: iso(20),
      resolvedAt: iso(15),
      amountCents: 600_000,
    },
    {
      id: "demo-buffer",
      rungId: "liquidity",
      summary: "Build the buffer first",
      outcome: "held",
      decidedAt: iso(34),
      resolvedAt: iso(29),
      amountCents: 9_000_000,
    },
    {
      id: "demo-buffer-2",
      rungId: "liquidity",
      summary: "Move the bonus into the buffer",
      outcome: "held",
      decidedAt: iso(47),
      resolvedAt: iso(44),
      amountCents: 1_800_000,
    },
    {
      id: "demo-match-early",
      rungId: "match",
      summary: "Raise the contribution now",
      outcome: "deferred",
      decidedAt: iso(78),
      resolvedAt: iso(78),
      amountCents: 480_000,
    },
    {
      id: "demo-buffer-open",
      rungId: "liquidity",
      summary: "Open a separate account for the buffer",
      outcome: "held",
      decidedAt: iso(96),
      resolvedAt: iso(92),
      amountCents: 500_000,
    },
    {
      id: "demo-card-early",
      rungId: "high-interest-debt",
      summary: "Clear the card balance",
      outcome: "held",
      decidedAt: iso(129),
      resolvedAt: iso(120),
      amountCents: 210_000,
    },
    {
      id: "demo-buffer-start",
      rungId: "liquidity",
      summary: "Start the buffer",
      outcome: "held",
      decidedAt: iso(190),
      resolvedAt: iso(184),
      amountCents: 1_200_000,
    },
  ] as unknown) as Decision[]);
}
