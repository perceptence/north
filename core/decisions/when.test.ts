import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { WHEN_OPTIONS, whenToDate } from "./when.ts";
import { catchUpDue } from "./catch-up.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { Decision } from "./types.ts";

const NOW = new Date("2026-08-04T00:00:00.000Z");
const DAY = 86_400_000;
const daysBack = (d: Date) => Math.round((NOW.getTime() - d.getTime()) / DAY);

describe("WHEN_OPTIONS — four spans, widening", () => {
  test("there are four, and they get older", () => {
    assert.equal(WHEN_OPTIONS.length, 4);
    const ages = WHEN_OPTIONS.map((o) => o.daysAgo);
    assert.deepEqual(ages, [...ages].sort((a, b) => a - b));
  });

  test("every option is in the past", () => {
    for (const option of WHEN_OPTIONS) assert.ok(option.daysAgo > 0);
  });

  test("each is worded as a person would say it, not as a range", () => {
    for (const option of WHEN_OPTIONS) {
      assert.ok(option.label.length > 0);
      // No digits: "14 days ago" is a database talking, and the whole point
      // of asking this way is that nobody remembers the date.
      assert.doesNotMatch(option.label, /\d/);
    }
  });

  /**
   * The reason this was split from three. "Longer ago" carrying everything
   * past a month put last quarter and two years ago in one bucket, and the
   * ledger groups by MONTH — so they would have filed together.
   */
  test("the two oldest fall in different months", () => {
    const months = WHEN_OPTIONS.slice(2).map((o) =>
      whenToDate(o.id, NOW).getUTCMonth(),
    );
    assert.notEqual(months[0], months[1]);
  });
});

describe("whenToDate", () => {
  test("resolves to the middle of the span, not its edge", () => {
    // "Earlier this month" is neither today nor the 1st.
    const weeks = daysBack(whenToDate("weeks", NOW));
    assert.ok(weeks > 2 && weeks < 30);
  });

  test("each choice lands further back than the one before", () => {
    const dates = WHEN_OPTIONS.map((o) => whenToDate(o.id, NOW).getTime());
    for (let i = 1; i < dates.length; i += 1) {
      assert.ok(dates[i]! < dates[i - 1]!);
    }
  });

  test("it reads the clock it is given, never the real one", () => {
    const other = new Date("2020-01-01T00:00:00.000Z");
    assert.equal(
      whenToDate("days", other).getTime(),
      other.getTime() - 2 * DAY,
    );
  });

  test("an unknown choice records now — it never invents a past", () => {
    const at = whenToDate("nonsense" as never, NOW);
    assert.equal(at.getTime(), NOW.getTime());
  });
});

/* ── The interaction that matters ────────────────────────────────────────── */

const f = <T>(value: T, asOf: string) => ({
  value,
  confidence: "stated" as const,
  asOf,
});

function profileWithDebtLearnedOn(asOf: string): SituationProfile {
  return {
    openingConcern: f("—", asOf),
    financialConfidence: f("mostly-ok", asOf),
    incomeBand: f("100k-200k", asOf),
    liquidCents: f(1, asOf),
    monthlyOutCents: f(1, asOf),
    obligations: f([{ kind: "card", balanceCents: 1, rateBps: 2_200 }], asOf),
    dependents: f(0, asOf),
    retirementBps: f(0, asOf),
    employerMatchBps: f(0, asOf),
    horizonMonths: f(240, asOf),
  } as unknown as SituationProfile;
}

const heldOn = (decidedAt: Date): Decision => ({
  id: "d1",
  rungId: "high-interest-debt",
  summary: "Clear the expensive debt first",
  outcome: "held",
  decidedAt: decidedAt.toISOString(),
});

describe("back-dating and the catch-up, together", () => {
  /**
   * The behaviour that looks like a bug and is the point. `catchUpDue` fires
   * only while `field.asOf < settledAt`, so an action dated BEFORE North last
   * learned the figure raises no question — correctly, because that figure
   * already accounts for it. This is why `whenToDate` has no clamp.
   */
  test("acting after North last learned the figure DOES ask what changed", () => {
    const profile = profileWithDebtLearnedOn("2026-01-01T00:00:00.000Z");
    const decision = heldOn(whenToDate("weeks", NOW)); // 14 days ago
    assert.equal(catchUpDue(profile, [decision]), "expensiveDebt");
  });

  test("acting BEFORE it does not — the figure already accounts for it", () => {
    const profile = profileWithDebtLearnedOn("2026-07-25T00:00:00.000Z");
    const decision = heldOn(whenToDate("longer", NOW)); // 240 days ago
    assert.equal(catchUpDue(profile, [decision]), null);
  });

  test("the recorded date is the answer given, unmodified", () => {
    const chosen = whenToDate("months", NOW);
    const decision = heldOn(chosen);
    assert.equal(decision.decidedAt, chosen.toISOString());
  });
});
